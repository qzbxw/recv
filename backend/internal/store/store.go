package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/db"
	"recv/backend/internal/metrics"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shopspring/decimal"
)

var ErrNotFound = errors.New("not found")
var ErrAmbiguousPaymentMatch = errors.New("ambiguous payment match")
var ErrActivePaymentCollision = errors.New("active invoice with same payment details already exists")

type Store struct {
	pool *pgxpool.Pool
}

const workspaceSelectColumns = `
	id,
	owner_telegram_id,
	COALESCE(username, ''),
	COALESCE(email, ''),
	default_network,
	COALESCE(language, 'en'),
	plan_code,
	subscription_ends_at,
	free_invoices_used,
	is_blocked,
	telegram_linked_at,
	created_at,
	discount_percent,
	COALESCE(discount_plan_code, ''),
	bot_blocked,
	last_retention_reminder_at,
	retention_stage
`

const invoiceSelectColumns = `
	id,
	public_id,
	workspace_id,
	kind,
	subscription_days,
	plan_code,
	title,
	base_amount_usd,
	payable_amount,
	payable_network,
	destination_address,
	payment_comment,
	matching_suffix,
	status,
	expires_at,
	tx_hash,
	paid_at,
	received_amount,
	last_payment_event_id,
	review_reason,
	finalized_at,
	mode,
	created_at
`

const paymentOptionSelectColumns = `
	id,
	invoice_id,
	network,
	asset,
	payable_amount,
	destination_address,
	payment_comment,
	matching_suffix,
	payment_uri,
	is_default,
	created_at
`

func New(ctx context.Context, databaseURL string) (*Store, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	if err := db.RunMigrations(ctx, pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	return &Store{pool: pool}, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) GetUserByID(ctx context.Context, id int64) (User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
		FROM users
		WHERE id = $1
	`, id).Scan(&u.ID, &u.TelegramID, &u.Username, &u.Email, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return u, err
}

func (s *Store) GetUserByTelegramID(ctx context.Context, telegramID int64) (User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		SELECT id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
		FROM users
		WHERE telegram_id = $1
	`, telegramID).Scan(&u.ID, &u.TelegramID, &u.Username, &u.Email, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return u, err
}

func (s *Store) UpsertUser(ctx context.Context, telegramID int64, username string, email string) (User, error) {
	var u User
	err := s.pool.QueryRow(ctx, `
		INSERT INTO users (telegram_id, username, email)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))
		ON CONFLICT (telegram_id)
		DO UPDATE SET
			username = COALESCE(NULLIF(EXCLUDED.username, ''), users.username),
			email = COALESCE(NULLIF(EXCLUDED.email, ''), users.email)
		RETURNING id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
	`, telegramID, username, email).Scan(&u.ID, &u.TelegramID, &u.Username, &u.Email, &u.CreatedAt)
	return u, err
}

func (s *Store) ListWorkspacesForUser(ctx context.Context, userID int64) ([]Workspace, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			w.id,
			w.owner_telegram_id,
			COALESCE(w.username, ''),
			COALESCE(w.email, ''),
			w.default_network,
			COALESCE(w.language, 'en'),
			w.plan_code,
			w.subscription_ends_at,
			w.free_invoices_used,
			w.is_blocked,
			w.telegram_linked_at,
			w.created_at,
			w.discount_percent,
			COALESCE(w.discount_plan_code, ''),
			w.bot_blocked,
			w.last_retention_reminder_at,
			w.retention_stage
		FROM workspaces w
		JOIN workspace_members wm ON w.id = wm.workspace_id
		WHERE wm.user_id = $1
		ORDER BY w.created_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workspaces []Workspace
	for rows.Next() {
		w, err := scanWorkspace(rows)
		if err != nil {
			return nil, err
		}
		workspaces = append(workspaces, w)
	}
	return workspaces, nil
}

func (s *Store) AddWorkspaceMember(ctx context.Context, workspaceID, userID int64, role MemberRole) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO workspace_members (workspace_id, user_id, role)
		VALUES ($1, $2, $3)
		ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
	`, workspaceID, userID, role)
	return err
}

func (s *Store) CreateAgentWorkspace(ctx context.Context, syntheticTelegramID int64, username string, email string) (User, Workspace, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, Workspace{}, err
	}
	defer tx.Rollback(ctx)

	var user User
	if err := tx.QueryRow(ctx, `
		INSERT INTO users (telegram_id, username, email)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))
		RETURNING id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
	`, syntheticTelegramID, username, email).Scan(&user.ID, &user.TelegramID, &user.Username, &user.Email, &user.CreatedAt); err != nil {
		return User{}, Workspace{}, fmt.Errorf("create agent user: %w", err)
	}

	row := tx.QueryRow(ctx, `
		INSERT INTO workspaces (owner_telegram_id, username, email)
		VALUES (NULL, NULLIF($1, ''), NULLIF($2, ''))
		RETURNING `+workspaceSelectColumns+`
	`, username, email)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return User{}, Workspace{}, fmt.Errorf("create agent workspace: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO workspace_members (workspace_id, user_id, role)
		VALUES ($1, $2, $3)
	`, workspace.ID, user.ID, RoleOwner); err != nil {
		return User{}, Workspace{}, fmt.Errorf("create agent workspace member: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, Workspace{}, err
	}
	return user, workspace, nil
}

func (s *Store) UpsertWorkspaceByTelegram(ctx context.Context, telegramID int64, username string) (Workspace, error) {
	// 1. Upsert user
	user, err := s.UpsertUser(ctx, telegramID, username, "")
	if err != nil {
		return Workspace{}, fmt.Errorf("upsert user: %w", err)
	}
	if err := s.LinkTelegramIdentity(ctx, user.ID, telegramID, username); err != nil {
		return Workspace{}, err
	}

	// 2. Find existing workspace owned by this telegram ID
	w, err := s.GetWorkspaceByTelegramID(ctx, telegramID)
	if err == nil {
		if w.BotBlocked {
			_, _ = s.pool.Exec(ctx, `UPDATE workspaces SET bot_blocked = FALSE WHERE id = $1`, w.ID)
			w.BotBlocked = false
		}
		// Ensure user is member
		_ = s.AddWorkspaceMember(ctx, w.ID, user.ID, RoleOwner)
		return w, nil
	}
	if !errors.Is(err, ErrNotFound) {
		return Workspace{}, err
	}

	// 3. Create a default workspace if not found
	row := s.pool.QueryRow(ctx, `
		INSERT INTO workspaces (owner_telegram_id, username, telegram_linked_at)
		VALUES ($1, NULLIF($2, ''), NOW())
		RETURNING `+workspaceSelectColumns+`
	`, telegramID, username)
	w, err = scanWorkspace(row)
	if err != nil {
		return Workspace{}, err
	}

	// 4. Add them as an owner in workspace_members
	err = s.AddWorkspaceMember(ctx, w.ID, user.ID, RoleOwner)
	if err != nil {
		return Workspace{}, err
	}

	return w, nil
}

func (s *Store) GetWorkspaceByID(ctx context.Context, workspaceID int64) (Workspace, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+workspaceSelectColumns+`
		FROM workspaces
		WHERE id = $1
	`, workspaceID)
	return scanWorkspace(row)
}

func (s *Store) GetWorkspaceByTelegramID(ctx context.Context, telegramID int64) (Workspace, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+workspaceSelectColumns+`
		FROM workspaces
		WHERE owner_telegram_id = $1
	`, telegramID)
	return scanWorkspace(row)
}

func (s *Store) GetWorkspaceByUsername(ctx context.Context, username string) (Workspace, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+workspaceSelectColumns+`
		FROM workspaces
		WHERE LOWER(username) = LOWER($1)
	`, username)
	return scanWorkspace(row)
}

func (s *Store) GrantPRO(ctx context.Context, workspaceID int64, days int) (Workspace, error) {
	if days <= 0 {
		days = 30
	}

	row := s.pool.QueryRow(ctx, `
		UPDATE workspaces
		SET plan_code = 'merchant',
		    subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + make_interval(days => $2)
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, days)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return Workspace{}, err
	}
	metrics.IncResourceOperation("workspace_subscription", "grant_pro", "success")
	return workspace, nil
}

func (s *Store) SetWorkspaceBlocked(ctx context.Context, workspaceID int64, blocked bool) (Workspace, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE workspaces
		SET is_blocked = $2
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, blocked)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return Workspace{}, err
	}
	metrics.IncResourceOperation("workspace", "set_blocked", "success")
	return workspace, nil
}

func (s *Store) UpdateWorkspaceEmail(ctx context.Context, workspaceID int64, email string) (Workspace, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE workspaces
		SET email = NULLIF($2, '')
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, email)
	workspace, err := scanWorkspace(row)
	if err != nil {
		metrics.IncResourceOperation("workspace_email", "update", "failure")
		return Workspace{}, err
	}
	metrics.IncResourceOperation("workspace_email", "update", "success")
	return workspace, nil
}

func (s *Store) UpdateWorkspaceLanguage(ctx context.Context, workspaceID int64, language string) (Workspace, error) {
	language = NormalizeLanguage(language)
	row := s.pool.QueryRow(ctx, `
		UPDATE workspaces
		SET language = $2
		WHERE id = $1
		RETURNING `+workspaceSelectColumns+`
	`, workspaceID, language)
	workspace, err := scanWorkspace(row)
	if err != nil {
		metrics.IncResourceOperation("workspace_language", "update", "failure")
		return Workspace{}, err
	}
	metrics.IncResourceOperation("workspace_language", "update", "success")
	return workspace, nil
}

func (s *Store) StoreTelegramAuthCode(ctx context.Context, workspaceID int64, codeHash string, expiresAt time.Time) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin store telegram auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE telegram_auth_codes
		SET consumed_at = NOW()
		WHERE workspace_id = $1
		  AND consumed_at IS NULL
	`, workspaceID); err != nil {
		return fmt.Errorf("expire active telegram auth codes: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO telegram_auth_codes (workspace_id, code_hash, expires_at)
		VALUES ($1, $2, $3)
	`, workspaceID, codeHash, expiresAt); err != nil {
		return fmt.Errorf("insert telegram auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit telegram auth code: %w", err)
	}
	return nil
}

func (s *Store) ConsumeTelegramAuthCode(ctx context.Context, workspaceID int64, codeHash string) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin consume telegram auth code tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var id int64
	row := tx.QueryRow(ctx, `
		UPDATE telegram_auth_codes
		SET consumed_at = NOW()
		WHERE id = (
			SELECT id
			FROM telegram_auth_codes
			WHERE workspace_id = $1
			  AND code_hash = $2
			  AND consumed_at IS NULL
			  AND expires_at > NOW()
			ORDER BY created_at DESC
			LIMIT 1
			FOR UPDATE
		)
		RETURNING id
	`, workspaceID, codeHash)
	if err := row.Scan(&id); errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	} else if err != nil {
		return fmt.Errorf("consume telegram auth code: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit consume telegram auth code: %w", err)
	}
	return nil
}

func (s *Store) ListWallets(ctx context.Context, workspaceID int64) ([]Wallet, error) {
	wallets := make([]Wallet, 0)
	rows, err := s.pool.Query(ctx, `
		SELECT id, workspace_id, network, address, environment, is_active, created_at
		FROM wallets
		WHERE workspace_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`, workspaceID)
	if err != nil {
		return nil, fmt.Errorf("list wallets: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		wallet, err := scanWallet(rows)
		if err != nil {
			return nil, err
		}
		wallets = append(wallets, wallet)
	}
	return wallets, rows.Err()
}

func (s *Store) CreateWallet(ctx context.Context, workspaceID int64, network Network, address string, env ...Environment) (Wallet, error) {
	walletEnv := EnvironmentLive
	if len(env) > 0 && env[0] != "" {
		walletEnv = env[0]
	}
	row := s.pool.QueryRow(ctx, `
		INSERT INTO wallets (workspace_id, network, address, environment, is_active)
		VALUES ($1, $2, $3, $4, TRUE)
		ON CONFLICT (workspace_id, network, address)
		DO UPDATE SET is_active = TRUE
		RETURNING id, workspace_id, network, address, environment, is_active, created_at
	`, workspaceID, network, address, walletEnv)
	wallet, err := scanWallet(row)
	if err != nil {
		metrics.IncResourceOperation("wallet", "create", "failure")
		return Wallet{}, err
	}
	metrics.IncResourceOperation("wallet", "create", "success")
	return wallet, nil
}

func (s *Store) DeactivateWallet(ctx context.Context, workspaceID int64, walletID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE wallets
		SET is_active = FALSE
		WHERE id = $1 AND workspace_id = $2
	`, walletID, workspaceID)
	if err != nil {
		metrics.IncResourceOperation("wallet", "deactivate", "failure")
		return fmt.Errorf("deactivate wallet: %w", err)
	}
	if tag.RowsAffected() == 0 {
		metrics.IncResourceOperation("wallet", "deactivate", "not_found")
		return ErrNotFound
	}
	metrics.IncResourceOperation("wallet", "deactivate", "success")
	return nil
}

func (s *Store) GetActiveWalletForNetwork(ctx context.Context, workspaceID int64, network Network) (Wallet, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, workspace_id, network, address, environment, is_active, created_at
		FROM wallets
		WHERE workspace_id = $1 AND network = $2 AND is_active = TRUE
		ORDER BY created_at DESC
		LIMIT 1
	`, workspaceID, network)
	return scanWallet(row)
}

func (s *Store) GetWalletByID(ctx context.Context, workspaceID int64, walletID int64) (Wallet, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, workspace_id, network, address, environment, is_active, created_at
		FROM wallets
		WHERE id = $1 AND workspace_id = $2 AND is_active = TRUE
	`, walletID, workspaceID)
	return scanWallet(row)
}

func (s *Store) CountInvoicesCreated(ctx context.Context, workspaceID int64) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `SELECT COUNT(1) FROM invoices WHERE workspace_id = $1`, workspaceID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("count invoices: %w", err)
	}
	return count, nil
}

func (s *Store) InvoicePublicIDExists(ctx context.Context, publicID string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invoices WHERE public_id = $1)`, publicID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check public id: %w", err)
	}
	return exists, nil
}

func (s *Store) TONCommentExists(ctx context.Context, comment string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM invoices WHERE payment_comment = $1)`, comment).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check payment comment: %w", err)
	}
	return exists, nil
}

func (s *Store) SuffixRecentlyUsed(ctx context.Context, address string, network Network, suffix decimal.Decimal) (bool, error) {
	return s.SuffixRecentlyUsedForAsset(ctx, address, network, DefaultAssetForNetwork(network), suffix)
}

func (s *Store) SuffixRecentlyUsedForAsset(ctx context.Context, address string, network Network, asset PaymentAsset, suffix decimal.Decimal) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM invoice_payment_options ipo
			JOIN invoices i ON i.id = ipo.invoice_id
			WHERE ipo.destination_address = $1
			  AND ipo.network = $2
			  AND ipo.asset = $3
			  AND ipo.matching_suffix = $4
			  AND i.mode = 'live'
			  AND i.status IN ('awaiting_payment', 'underpaid')
		)
	`, address, network, asset, suffix).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check suffix collision: %w", err)
	}
	return exists, nil
}

type CreateInvoiceParams struct {
	PublicID           string
	WorkspaceID        int64
	Kind               InvoiceKind
	SubscriptionDays   int
	PlanCode           PlanCode
	CountTowardsTrial  bool
	Title              string
	BaseAmountUSD      decimal.Decimal
	PayableAmount      decimal.Decimal
	PayableNetwork     Network
	DestinationAddress string
	PaymentComment     *string
	MatchingSuffix     *decimal.Decimal
	PayableAsset       PaymentAsset
	PaymentOptions     []CreatePaymentOptionParams
	ExpiresAt          time.Time
	Mode               string
}

type CreatePaymentOptionParams struct {
	Network            Network
	Asset              PaymentAsset
	PayableAmount      decimal.Decimal
	DestinationAddress string
	PaymentComment     *string
	MatchingSuffix     *decimal.Decimal
	PaymentURI         string
	IsDefault          bool
}

func (s *Store) CreateInvoice(ctx context.Context, params CreateInvoiceParams) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin create invoice tx: %w", err)
	}
	defer tx.Rollback(ctx)
	if params.Mode == "" {
		params.Mode = "live"
	}
	if params.PayableAsset == "" {
		params.PayableAsset = DefaultAssetForNetwork(params.PayableNetwork)
	}
	if len(params.PaymentOptions) == 0 {
		params.PaymentOptions = []CreatePaymentOptionParams{{
			Network:            params.PayableNetwork,
			Asset:              params.PayableAsset,
			PayableAmount:      params.PayableAmount,
			DestinationAddress: params.DestinationAddress,
			PaymentComment:     params.PaymentComment,
			MatchingSuffix:     params.MatchingSuffix,
			IsDefault:          true,
		}}
	}
	if !params.PaymentOptions[0].IsDefault {
		params.PaymentOptions[0].IsDefault = true
	}
	if params.Mode == "live" {
		for _, option := range params.PaymentOptions {
			var collision bool
			if err := tx.QueryRow(ctx, `
				SELECT EXISTS(
					SELECT 1
					FROM invoice_payment_options ipo
					JOIN invoices i ON i.id = ipo.invoice_id
					WHERE ipo.destination_address = $1
					  AND ipo.network = $2
					  AND ipo.asset = $3
					  AND ipo.payable_amount = $4
					  AND i.mode = 'live'
					  AND i.status IN ('awaiting_payment', 'underpaid')
					FOR UPDATE
				)
			`, option.DestinationAddress, option.Network, option.Asset, option.PayableAmount).Scan(&collision); err != nil {
				return Invoice{}, fmt.Errorf("check active payment option collision: %w", err)
			}
			if collision {
				return Invoice{}, ErrActivePaymentCollision
			}
		}
	}

	var invoice Invoice
	row := tx.QueryRow(ctx, `
		INSERT INTO invoices (
			public_id,
			workspace_id,
			kind,
			subscription_days,
			plan_code,
			title,
			base_amount_usd,
			payable_amount,
			payable_network,
			destination_address,
			payment_comment,
			matching_suffix,
			status,
			expires_at,
			mode
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'awaiting_payment', $13, $14)
		RETURNING `+invoiceSelectColumns+`
	`, params.PublicID, params.WorkspaceID, params.Kind, params.SubscriptionDays, params.PlanCode, params.Title, params.BaseAmountUSD, params.PayableAmount, params.PayableNetwork,
		params.DestinationAddress, params.PaymentComment, params.MatchingSuffix, params.ExpiresAt, params.Mode)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if _, err := tx.Exec(ctx, `
		DELETE FROM invoice_payment_options
		WHERE invoice_id = $1
	`, invoice.ID); err != nil {
		return Invoice{}, fmt.Errorf("clear invoice payment options: %w", err)
	}
	for i, option := range params.PaymentOptions {
		if option.Asset == "" {
			option.Asset = DefaultAssetForNetwork(option.Network)
		}
		if option.IsDefault || i == 0 {
			option.IsDefault = true
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO invoice_payment_options (
				invoice_id,
				network,
				asset,
				payable_amount,
				destination_address,
				payment_comment,
				matching_suffix,
				payment_uri,
				is_default
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`, invoice.ID, option.Network, option.Asset, option.PayableAmount, option.DestinationAddress, option.PaymentComment, option.MatchingSuffix, option.PaymentURI, option.IsDefault); err != nil {
			return Invoice{}, fmt.Errorf("insert invoice payment option: %w", err)
		}
	}
	invoice.PaymentOptions = paramsToPaymentOptions(invoice.ID, params.PaymentOptions)
	invoice.PayableAsset = params.PaymentOptions[0].Asset

	if params.CountTowardsTrial {
		if _, err := tx.Exec(ctx, `
			UPDATE workspaces
			SET free_invoices_used = free_invoices_used + 1
			WHERE id = $1
		`, params.WorkspaceID); err != nil {
			return Invoice{}, fmt.Errorf("increment free_invoices_used: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit create invoice tx: %w", err)
	}
	metrics.IncInvoiceTransition(metrics.SourceFromContext(ctx), string(invoice.Kind), "new", string(invoice.Status), "created")
	return invoice, nil
}

type ListInvoicesFilter struct {
	Limit  int
	Offset int
	Status string
	Query  string
}

func (s *Store) ListInvoices(ctx context.Context, workspaceID int64, filter ListInvoicesFilter) ([]Invoice, int, error) {
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}
	invoices := make([]Invoice, 0)
	args := []any{workspaceID}
	where := []string{"workspace_id = $1"}
	if filter.Status != "" && filter.Status != "all" {
		args = append(args, filter.Status)
		where = append(where, fmt.Sprintf("status = $%d::invoice_status", len(args)))
	}
	if strings.TrimSpace(filter.Query) != "" {
		args = append(args, "%"+strings.ToLower(strings.TrimSpace(filter.Query))+"%")
		where = append(where, fmt.Sprintf("(LOWER(title) LIKE $%d OR LOWER(public_id) LIKE $%d OR LOWER(COALESCE(tx_hash, '')) LIKE $%d)", len(args), len(args), len(args)))
	}
	whereSQL := strings.Join(where, " AND ")

	var total int
	if err := s.pool.QueryRow(ctx, `SELECT COUNT(1) FROM invoices WHERE `+whereSQL, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count invoices: %w", err)
	}

	args = append(args, filter.Limit, filter.Offset)
	rows, err := s.pool.Query(ctx, `
		SELECT `+invoiceSelectColumns+`
		FROM invoices
		WHERE `+whereSQL+`
		ORDER BY created_at DESC
		LIMIT $`+strconv.Itoa(len(args)-1)+` OFFSET $`+strconv.Itoa(len(args))+`
	`, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list invoices: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		invoice, err := scanInvoice(rows)
		if err != nil {
			return nil, 0, err
		}
		invoices = append(invoices, invoice)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	if err := s.attachPaymentOptions(ctx, invoices); err != nil {
		return nil, 0, err
	}
	return invoices, total, nil
}

func (s *Store) GetInvoiceByID(ctx context.Context, workspaceID int64, invoiceID int64) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+invoiceSelectColumns+`
		FROM invoices
		WHERE id = $1 AND workspace_id = $2
	`, invoiceID, workspaceID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	options, err := s.ListPaymentOptionsForInvoice(ctx, invoice.ID)
	if err != nil {
		return Invoice{}, err
	}
	applyPaymentOptions(&invoice, options)
	return invoice, nil
}

func (s *Store) GetInvoiceByPublicID(ctx context.Context, publicID string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+invoiceSelectColumns+`
		FROM invoices
		WHERE public_id = $1
	`, publicID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	options, err := s.ListPaymentOptionsForInvoice(ctx, invoice.ID)
	if err != nil {
		return Invoice{}, err
	}
	applyPaymentOptions(&invoice, options)
	return invoice, nil
}

func (s *Store) SetInvoiceStatus(ctx context.Context, workspaceID int64, invoiceID int64, status InvoiceStatus) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1
		WHERE id = $2 AND workspace_id = $3
		RETURNING `+invoiceSelectColumns+`
	`, status, invoiceID, workspaceID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	metrics.IncInvoiceTransition(metrics.SourceFromContext(ctx), string(invoice.Kind), "unknown", string(status), "manual_status_update")
	return invoice, nil
}

func (s *Store) MarkInvoicePaidManual(ctx context.Context, workspaceID int64, invoiceID int64) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin manual mark paid tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var previousStatus InvoiceStatus
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM invoices
		WHERE id = $1 AND workspace_id = $2
		FOR UPDATE
	`, invoiceID, workspaceID).Scan(&previousStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Invoice{}, ErrNotFound
		}
		return Invoice{}, fmt.Errorf("load invoice before manual mark paid: %w", err)
	}

	row := tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = 'paid',
		    paid_at = NOW(),
		    received_amount = GREATEST(received_amount, payable_amount),
		    finalized_at = COALESCE(finalized_at, NOW()),
		    review_reason = NULL
		WHERE id = $1 AND workspace_id = $2
		RETURNING `+invoiceSelectColumns+`
	`, invoiceID, workspaceID)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
		return Invoice{}, err
	}
	transitionID, err := insertInvoiceTransitionTx(ctx, tx, invoice, previousStatus, invoice.Status, "manual_mark_paid", 0, invoice.PayableAmount, invoice.PayableAmount, "workspace", fmt.Sprintf("%d", workspaceID))
	if err != nil {
		return Invoice{}, err
	}
	if err := enqueueWebhookEventsTx(ctx, tx, invoice, "manual_mark_paid", invoice.PayableAmount, transitionID); err != nil {
		return Invoice{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit manual mark paid tx: %w", err)
	}
	source := metrics.SourceFromContext(ctx)
	metrics.IncInvoiceTransition(source, string(invoice.Kind), string(previousStatus), string(invoice.Status), "manual_mark_paid")
	if invoice.Kind == InvoiceKindSubscription {
		metrics.IncInvoiceOperation("activate_subscription", source, string(invoice.Kind), string(invoice.PayableNetwork), string(invoice.PlanCode), "success", "manual_mark_paid")
	}
	return invoice, nil
}

func (s *Store) ExpireOverdueInvoices(ctx context.Context) (int64, error) {
	tag, err := s.pool.Exec(ctx, `
		UPDATE invoices
		SET status = 'expired'
		WHERE status = 'awaiting_payment'
		  AND expires_at < NOW()
	`)
	if err != nil {
		return 0, fmt.Errorf("expire overdue invoices: %w", err)
	}
	metrics.ObserveBatch("expired_invoices", metrics.SourceFromContext(ctx), int(tag.RowsAffected()))
	return tag.RowsAffected(), nil
}

func (s *Store) RecordObservedTransfer(ctx context.Context, transfer ObservedTransfer) (PaymentEvent, bool, error) {
	comment := any(nil)
	if transfer.PaymentComment != "" {
		comment = transfer.PaymentComment
	}
	externalEventID := normalizeExternalEventID(transfer)

	var event PaymentEvent
	row := s.pool.QueryRow(ctx, `
		INSERT INTO payment_events (tx_hash, network, asset, destination_address, amount, payment_comment, observed_at, raw_payload, external_event_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		ON CONFLICT (external_event_id) DO NOTHING
		RETURNING id, tx_hash, network, asset, destination_address, amount, payment_comment, observed_at, raw_payload, matched_invoice_id, classification, external_event_id, allocated_amount, created_at
	`, transfer.TxHash, transfer.Network, transfer.Asset, transfer.DestinationAddress, transfer.Amount, comment, transfer.ObservedAt, transfer.RawPayload, externalEventID)
	if err := scanPaymentEvent(row, &event); err != nil {
		if errors.Is(err, ErrNotFound) {
			return PaymentEvent{TxHash: transfer.TxHash, Network: transfer.Network, ExternalEventID: externalEventID}, false, nil
		}
		return PaymentEvent{}, false, fmt.Errorf("record observed transfer: %w", err)
	}
	return event, true, nil
}

func normalizeExternalEventID(transfer ObservedTransfer) string {
	if strings.TrimSpace(transfer.ExternalEventID) != "" {
		return strings.TrimSpace(transfer.ExternalEventID)
	}
	if strings.TrimSpace(string(transfer.Asset)) != "" {
		return string(transfer.Network) + ":" + string(transfer.Asset) + ":" + strings.TrimSpace(transfer.TxHash)
	}
	return string(transfer.Network) + ":" + strings.TrimSpace(transfer.TxHash)
}

func (s *Store) FindInvoiceByGramComment(ctx context.Context, address string, comment string) (Invoice, error) {
	return s.FindInvoiceByPaymentComment(ctx, address, NetworkTON, AssetGRAM, comment)
}

func (s *Store) FindInvoiceByPaymentComment(ctx context.Context, address string, network Network, asset PaymentAsset, comment string) (Invoice, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT `+prefixedInvoiceSelectColumns("i")+`
		FROM invoice_payment_options ipo
		JOIN invoices i ON i.id = ipo.invoice_id
		WHERE ipo.network = $1
		  AND ipo.asset = $2
		  AND ipo.destination_address = $3
		  AND ipo.payment_comment = $4
		  AND i.mode = 'live'
		  AND i.status IN ('awaiting_payment', 'underpaid', 'expired')
		ORDER BY i.created_at DESC
		LIMIT 1
	`, network, asset, address, comment)
	invoice, err := scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	options, err := s.ListPaymentOptionsForInvoice(ctx, invoice.ID)
	if err != nil {
		return Invoice{}, err
	}
	applyPaymentOptions(&invoice, options)
	return invoice, nil
}

func (s *Store) FindInvoiceByExactAmount(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	return s.FindInvoiceByExactAmountAndAsset(ctx, address, network, DefaultAssetForNetwork(network), amount)
}

func (s *Store) FindInvoiceByExactAmountAndAsset(ctx context.Context, address string, network Network, asset PaymentAsset, amount decimal.Decimal) (Invoice, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT `+prefixedInvoiceSelectColumns("i")+`
		FROM invoice_payment_options ipo
		JOIN invoices i ON i.id = ipo.invoice_id
		WHERE ipo.destination_address = $1
		  AND ipo.network = $2
		  AND ipo.asset = $3
		  AND ipo.payable_amount = $4
		  AND i.mode = 'live'
		  AND i.status IN ('awaiting_payment', 'underpaid', 'expired')
		ORDER BY i.created_at DESC
		LIMIT 2
	`, address, network, asset, amount)
	if err != nil {
		return Invoice{}, fmt.Errorf("find invoice by exact amount: %w", err)
	}
	defer rows.Close()
	invoices := make([]Invoice, 0, 2)
	for rows.Next() {
		invoice, err := scanInvoice(rows)
		if err != nil {
			return Invoice{}, err
		}
		invoices = append(invoices, invoice)
	}
	if err := rows.Err(); err != nil {
		return Invoice{}, err
	}
	if len(invoices) == 0 {
		return Invoice{}, ErrNotFound
	}
	if len(invoices) > 1 {
		return Invoice{}, ErrAmbiguousPaymentMatch
	}
	options, err := s.ListPaymentOptionsForInvoice(ctx, invoices[0].ID)
	if err != nil {
		return Invoice{}, err
	}
	applyPaymentOptions(&invoices[0], options)
	selectInvoicePaymentOption(&invoices[0], network, asset)
	return invoices[0], nil
}

func (s *Store) FindPotentialUnderpaidInvoice(ctx context.Context, address string, network Network, amount decimal.Decimal) (Invoice, error) {
	return s.FindPotentialUnderpaidInvoiceByAsset(ctx, address, network, DefaultAssetForNetwork(network), amount)
}

func (s *Store) FindPotentialUnderpaidInvoiceByAsset(ctx context.Context, address string, network Network, asset PaymentAsset, amount decimal.Decimal) (Invoice, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT `+prefixedInvoiceSelectColumns("i")+`
		FROM invoice_payment_options ipo
		JOIN invoices i ON i.id = ipo.invoice_id
		WHERE ipo.destination_address = $1
		  AND ipo.network = $2
		  AND ipo.asset = $3
		  AND i.mode = 'live'
		  AND i.status IN ('awaiting_payment', 'underpaid', 'expired')
		  AND ipo.payable_amount > $4
		  AND ipo.payable_amount - $4 <= 2.500000
		  AND ROUND(ipo.payable_amount - TRUNC(ipo.payable_amount), 6) = ROUND($4 - TRUNC($4), 6)
		ORDER BY ipo.payable_amount - $4 ASC, i.created_at DESC
		LIMIT 2
	`, address, network, asset, amount)
	if err != nil {
		return Invoice{}, fmt.Errorf("find potential underpaid invoice: %w", err)
	}
	defer rows.Close()
	invoices := make([]Invoice, 0, 2)
	for rows.Next() {
		invoice, err := scanInvoice(rows)
		if err != nil {
			return Invoice{}, err
		}
		invoices = append(invoices, invoice)
	}
	if err := rows.Err(); err != nil {
		return Invoice{}, err
	}
	if len(invoices) == 0 {
		return Invoice{}, ErrNotFound
	}
	if len(invoices) > 1 {
		return Invoice{}, ErrAmbiguousPaymentMatch
	}
	options, err := s.ListPaymentOptionsForInvoice(ctx, invoices[0].ID)
	if err != nil {
		return Invoice{}, err
	}
	applyPaymentOptions(&invoices[0], options)
	selectInvoicePaymentOption(&invoices[0], network, asset)
	return invoices[0], nil
}

func (s *Store) MarkPaymentEventUnmatched(ctx context.Context, eventID int64, classification string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE payment_events
		SET classification = $1
		WHERE id = $2
	`, classification, eventID)
	if err != nil {
		return fmt.Errorf("mark payment event unmatched: %w", err)
	}
	return nil
}

type InvoicePaymentDecision struct {
	Classification string
	Status         InvoiceStatus
	TotalReceived  decimal.Decimal
	ReviewReason   *string
}

func DecideInvoicePaymentStatus(invoice Invoice, observedAmount decimal.Decimal, observedAt time.Time, classificationHint string) InvoicePaymentDecision {
	totalReceived := invoice.ReceivedAmount.Add(observedAmount).Round(9)
	if classificationHint == "manual_mark_paid" || classificationHint == "test_simulated" {
		return InvoicePaymentDecision{
			Classification: classificationHint,
			Status:         InvoiceStatusPaid,
			TotalReceived:  invoice.PayableAmount,
		}
	}
	if invoice.Status == InvoiceStatusExpired || observedAt.After(invoice.ExpiresAt) {
		reason := "late_payment"
		return InvoicePaymentDecision{
			Classification: reason,
			Status:         InvoiceStatusManualReview,
			TotalReceived:  totalReceived,
			ReviewReason:   &reason,
		}
	}
	if totalReceived.LessThan(invoice.PayableAmount) {
		classification := "underpaid"
		if isLikelyExchangeFeeUnderpayment(invoice, totalReceived) {
			classification = "underpaid_fee_window"
		}
		return InvoicePaymentDecision{Classification: classification, Status: InvoiceStatusUnderpaid, TotalReceived: totalReceived}
	}
	if totalReceived.GreaterThan(invoice.PayableAmount) {
		reason := "overpaid"
		return InvoicePaymentDecision{
			Classification: reason,
			Status:         InvoiceStatusOverpaid,
			TotalReceived:  totalReceived,
			ReviewReason:   &reason,
		}
	}
	return InvoicePaymentDecision{Classification: "paid_exact", Status: InvoiceStatusPaid, TotalReceived: totalReceived}
}

func isLikelyExchangeFeeUnderpayment(invoice Invoice, totalReceived decimal.Decimal) bool {
	if invoice.MatchingSuffix == nil {
		return false
	}
	diff := invoice.PayableAmount.Sub(totalReceived)
	if diff.LessThanOrEqual(decimal.Zero) || diff.GreaterThan(decimal.RequireFromString("2.500000")) {
		return false
	}
	expectedFraction := invoice.PayableAmount.Sub(invoice.PayableAmount.Truncate(0)).Round(6)
	receivedFraction := totalReceived.Sub(totalReceived.Truncate(0)).Round(6)
	return expectedFraction.Equal(receivedFraction)
}

func (s *Store) CompleteInvoicePayment(ctx context.Context, invoiceID int64, previousStatus InvoiceStatus, paymentEventID int64, txHash string, status InvoiceStatus, classification string, observedAmount decimal.Decimal, paidAt time.Time) (Invoice, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Invoice{}, fmt.Errorf("begin payment completion tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var current Invoice
	row := tx.QueryRow(ctx, `
		SELECT `+invoiceSelectColumns+`
		FROM invoices
		WHERE id = $1
		FOR UPDATE
	`, invoiceID)
	current, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	previousStatus = current.Status
	decision := DecideInvoicePaymentStatus(current, observedAmount, paidAt, classification)
	status = decision.Status
	classification = decision.Classification
	reviewReason := any(nil)
	if decision.ReviewReason != nil {
		reviewReason = *decision.ReviewReason
	}

	var invoice Invoice
	row = tx.QueryRow(ctx, `
		UPDATE invoices
		SET status = $1::invoice_status,
		    tx_hash = COALESCE(tx_hash, $2),
		    paid_at = CASE WHEN $1::invoice_status = 'paid'::invoice_status THEN $3 ELSE paid_at END,
		    received_amount = $5,
		    last_payment_event_id = NULLIF($6, 0),
		    review_reason = $7,
		    finalized_at = CASE WHEN $1::invoice_status IN ('paid'::invoice_status, 'overpaid'::invoice_status, 'manual_review'::invoice_status) THEN COALESCE(finalized_at, NOW()) ELSE finalized_at END
		WHERE id = $4
		RETURNING `+invoiceSelectColumns+`
	`, status, txHash, paidAt, invoiceID, decision.TotalReceived, paymentEventID, reviewReason)
	invoice, err = scanInvoice(row)
	if err != nil {
		return Invoice{}, err
	}
	if invoice.Status == InvoiceStatusPaid {
		if err := applyInvoicePostPaymentEffects(ctx, tx, invoice); err != nil {
			return Invoice{}, err
		}
	}

	if paymentEventID > 0 {
		if _, err := tx.Exec(ctx, `
			INSERT INTO payment_allocations (invoice_id, payment_event_id, amount)
			VALUES ($1, $2, $3)
			ON CONFLICT (invoice_id, payment_event_id) DO NOTHING
		`, invoiceID, paymentEventID, observedAmount); err != nil {
			return Invoice{}, fmt.Errorf("insert payment allocation: %w", err)
		}
	}

	if _, err := tx.Exec(ctx, `
		UPDATE payment_events
		SET matched_invoice_id = $1, classification = $2, allocated_amount = $3
		WHERE id = NULLIF($4, 0) OR (NULLIF($4, 0) IS NULL AND tx_hash = $5)
	`, invoiceID, classification, observedAmount, paymentEventID, txHash); err != nil {
		return Invoice{}, fmt.Errorf("update payment event match: %w", err)
	}

	transitionID, err := insertInvoiceTransitionTx(ctx, tx, invoice, previousStatus, invoice.Status, classification, paymentEventID, observedAmount, invoice.ReceivedAmount, "system", "")
	if err != nil {
		return Invoice{}, err
	}

	var telegramID sql.NullInt64
	var workspaceLanguage string
	if err := tx.QueryRow(ctx, `SELECT owner_telegram_id, COALESCE(language, 'en') FROM workspaces WHERE id = $1`, invoice.WorkspaceID).Scan(&telegramID, &workspaceLanguage); err != nil {
		return Invoice{}, fmt.Errorf("load workspace telegram id: %w", err)
	}

	shouldNotify := previousStatus != invoice.Status || invoice.Status == InvoiceStatusUnderpaid
	if telegramID.Valid && shouldNotify {
		message := buildInvoiceNotificationMessage(workspaceLanguage, invoice, classification, observedAmount)
		payload := buildInvoiceNotificationPayload(workspaceLanguage, invoice, classification)
		if _, err := tx.Exec(ctx, `
			INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload)
			VALUES ($1, $2, $3, $4)
		`, invoice.WorkspaceID, telegramID.Int64, message, payload); err != nil {
			return Invoice{}, fmt.Errorf("queue workspace notification: %w", err)
		}
	}

	if shouldNotify && (invoice.Status == InvoiceStatusPaid || invoice.Status == InvoiceStatusUnderpaid || invoice.Status == InvoiceStatusOverpaid || invoice.Status == InvoiceStatusManualReview) {
		if err := enqueueWebhookEventsTx(ctx, tx, invoice, classification, observedAmount, transitionID); err != nil {
			return Invoice{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Invoice{}, fmt.Errorf("commit payment completion: %w", err)
	}
	source := metrics.SourceFromContext(ctx)
	metrics.IncInvoiceTransition(source, string(invoice.Kind), string(previousStatus), string(invoice.Status), classification)
	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		metrics.IncInvoiceOperation("activate_subscription", source, string(invoice.Kind), string(invoice.PayableNetwork), string(invoice.PlanCode), "success", classification)
	}
	return invoice, nil
}

func (s *Store) GetWatchedWallets(ctx context.Context, graceWindow time.Duration) ([]WatchedWallet, error) {
	if graceWindow <= 0 {
		graceWindow = 24 * time.Hour
	}
	rows, err := s.pool.Query(ctx, `
		SELECT DISTINCT
			CASE
				WHEN ipo.network IN ('BASE', 'BSC', 'ARBITRUM') AND ipo.asset = 'BNB' THEN 'BSC'
				WHEN ipo.network IN ('BASE', 'BSC', 'ARBITRUM') THEN 'EVM'
				WHEN ipo.network::text = 'TON_USDT' OR (ipo.network = 'TON' AND ipo.asset = 'USDT') THEN 'TON_USDT'
				ELSE ipo.network::text
			END AS poll_network,
			ipo.network,
			ipo.asset,
			ipo.destination_address
		FROM invoice_payment_options ipo
		JOIN invoices i ON i.id = ipo.invoice_id
		WHERE i.mode = 'live'
		  AND i.status IN ('awaiting_payment', 'underpaid', 'expired')
		  AND i.expires_at >= NOW() - $1::interval
	`, graceWindow.String())
	if err != nil {
		return nil, fmt.Errorf("get watched wallets: %w", err)
	}
	defer rows.Close()

	var wallets []WatchedWallet
	for rows.Next() {
		var wallet WatchedWallet
		if err := rows.Scan(&wallet.PollNetwork, &wallet.PayableNetwork, &wallet.Asset, &wallet.Address); err != nil {
			return nil, fmt.Errorf("scan watched wallet: %w", err)
		}
		wallets = append(wallets, wallet)
	}
	return wallets, rows.Err()
}

func (s *Store) ClaimNotificationJobs(ctx context.Context, limit int) ([]NotificationJob, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin notification claim tx: %w", err)
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT n.id, n.workspace_id, n.recipient_telegram_id, n.message, n.payload, n.attempts
		FROM notification_outbox n
		JOIN workspaces w ON n.workspace_id = w.id
		WHERE n.status IN ('pending', 'failed')
		  AND n.recipient_telegram_id IS NOT NULL
		  AND n.available_at <= NOW()
		  AND w.is_blocked = FALSE
		  AND w.bot_blocked = FALSE
		ORDER BY n.created_at ASC
		FOR UPDATE OF n SKIP LOCKED
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, fmt.Errorf("select notification jobs: %w", err)
	}
	defer rows.Close()

	var jobs []NotificationJob
	for rows.Next() {
		var job NotificationJob
		if err := rows.Scan(&job.ID, &job.WorkspaceID, &job.RecipientTelegramID, &job.Message, &job.Payload, &job.Attempts); err != nil {
			return nil, fmt.Errorf("scan notification job: %w", err)
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for _, job := range jobs {
		if _, err := tx.Exec(ctx, `
			UPDATE notification_outbox
			SET status = 'processing', attempts = attempts + 1
			WHERE id = $1
		`, job.ID); err != nil {
			return nil, fmt.Errorf("mark notification processing: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit notification claim: %w", err)
	}
	metrics.ObserveBatch("notification_claim", metrics.SourceFromContext(ctx), len(jobs))
	if len(jobs) > 0 {
		metrics.IncDeliveryEvent("telegram", "claim", "success")
	}
	return jobs, nil
}

func (s *Store) MarkNotificationSent(ctx context.Context, id int64) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE notification_outbox
		SET status = 'sent', sent_at = NOW(), last_error = NULL
		WHERE id = $1
	`, id)
	if err != nil {
		return fmt.Errorf("mark notification sent: %w", err)
	}
	metrics.IncDeliveryEvent("telegram", "send", "success")
	return nil
}

func (s *Store) MarkNotificationFailed(ctx context.Context, id int64, message string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE notification_outbox
		SET status = 'failed',
		    last_error = $2,
		    available_at = NOW() + INTERVAL '2 minutes'
		WHERE id = $1
	`, id, message)
	if err != nil {
		return fmt.Errorf("mark notification failed: %w", err)
	}
	metrics.IncDeliveryEvent("telegram", "send", "failed")
	return nil
}

func scanWorkspace(row pgx.Row) (Workspace, error) {
	var workspace Workspace
	var telegramID sql.NullInt64
	var discountPlanCode string
	err := row.Scan(
		&workspace.ID,
		&telegramID,
		&workspace.Username,
		&workspace.Email,
		&workspace.DefaultNetwork,
		&workspace.Language,
		&workspace.PlanCode,
		&workspace.SubscriptionEndsAt,
		&workspace.FreeInvoicesUsed,
		&workspace.IsBlocked,
		&workspace.TelegramLinkedAt,
		&workspace.CreatedAt,
		&workspace.DiscountPercent,
		&discountPlanCode,
		&workspace.BotBlocked,
		&workspace.LastRetentionReminderAt,
		&workspace.RetentionStage,
	)
	if discountPlanCode != "" {
		workspace.DiscountPlanCode = &discountPlanCode
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return Workspace{}, ErrNotFound
	}
	if err != nil {
		return Workspace{}, fmt.Errorf("scan workspace: %w", err)
	}
	if telegramID.Valid {
		value := telegramID.Int64
		workspace.OwnerTelegramID = &value
	}
	return workspace, nil
}

func scanWallet(row interface{ Scan(dest ...any) error }) (Wallet, error) {
	var wallet Wallet
	err := row.Scan(&wallet.ID, &wallet.WorkspaceID, &wallet.Network, &wallet.Address, &wallet.Environment, &wallet.IsActive, &wallet.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Wallet{}, ErrNotFound
	}
	if err != nil {
		return Wallet{}, fmt.Errorf("scan wallet: %w", err)
	}
	return wallet, nil
}

func scanInvoice(row interface{ Scan(dest ...any) error }) (Invoice, error) {
	var invoice Invoice
	err := row.Scan(
		&invoice.ID,
		&invoice.PublicID,
		&invoice.WorkspaceID,
		&invoice.Kind,
		&invoice.SubscriptionDays,
		&invoice.PlanCode,
		&invoice.Title,
		&invoice.BaseAmountUSD,
		&invoice.PayableAmount,
		&invoice.PayableNetwork,
		&invoice.DestinationAddress,
		&invoice.PaymentComment,
		&invoice.MatchingSuffix,
		&invoice.Status,
		&invoice.ExpiresAt,
		&invoice.TxHash,
		&invoice.PaidAt,
		&invoice.ReceivedAmount,
		&invoice.LastPaymentEventID,
		&invoice.ReviewReason,
		&invoice.FinalizedAt,
		&invoice.Mode,
		&invoice.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Invoice{}, ErrNotFound
	}
	if err != nil {
		return Invoice{}, fmt.Errorf("scan invoice: %w", err)
	}
	invoice.Environment = Environment(invoice.Mode)
	invoice.PayableAsset = DefaultAssetForNetwork(invoice.PayableNetwork)
	return invoice, nil
}

func scanPaymentEvent(row interface{ Scan(dest ...any) error }, event *PaymentEvent) error {
	err := row.Scan(
		&event.ID,
		&event.TxHash,
		&event.Network,
		&event.Asset,
		&event.DestinationAddress,
		&event.Amount,
		&event.PaymentComment,
		&event.ObservedAt,
		&event.RawPayload,
		&event.MatchedInvoiceID,
		&event.Classification,
		&event.ExternalEventID,
		&event.AllocatedAmount,
		&event.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

func scanPaymentOption(row interface{ Scan(dest ...any) error }) (PaymentOption, error) {
	var option PaymentOption
	err := row.Scan(
		&option.ID,
		&option.InvoiceID,
		&option.Network,
		&option.Asset,
		&option.PayableAmount,
		&option.DestinationAddress,
		&option.PaymentComment,
		&option.MatchingSuffix,
		&option.PaymentURI,
		&option.IsDefault,
		&option.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return PaymentOption{}, ErrNotFound
	}
	if err != nil {
		return PaymentOption{}, fmt.Errorf("scan payment option: %w", err)
	}
	return option, nil
}

func paramsToPaymentOptions(invoiceID int64, params []CreatePaymentOptionParams) []PaymentOption {
	options := make([]PaymentOption, 0, len(params))
	for _, param := range params {
		options = append(options, PaymentOption{
			InvoiceID:          invoiceID,
			Network:            param.Network,
			Asset:              param.Asset,
			PayableAmount:      param.PayableAmount,
			DestinationAddress: param.DestinationAddress,
			PaymentComment:     param.PaymentComment,
			MatchingSuffix:     param.MatchingSuffix,
			PaymentURI:         param.PaymentURI,
			IsDefault:          param.IsDefault,
		})
	}
	return options
}

func applyPaymentOptions(invoice *Invoice, options []PaymentOption) {
	if len(options) == 0 {
		options = []PaymentOption{{
			InvoiceID:          invoice.ID,
			Network:            invoice.PayableNetwork,
			Asset:              DefaultAssetForNetwork(invoice.PayableNetwork),
			PayableAmount:      invoice.PayableAmount,
			DestinationAddress: invoice.DestinationAddress,
			PaymentComment:     invoice.PaymentComment,
			MatchingSuffix:     invoice.MatchingSuffix,
			IsDefault:          true,
		}}
	}
	invoice.PaymentOptions = options
	for _, option := range options {
		if option.IsDefault {
			invoice.PayableNetwork = option.Network
			invoice.PayableAsset = option.Asset
			invoice.PayableAmount = option.PayableAmount
			invoice.DestinationAddress = option.DestinationAddress
			invoice.PaymentComment = option.PaymentComment
			invoice.MatchingSuffix = option.MatchingSuffix
			return
		}
	}
	invoice.PayableNetwork = options[0].Network
	invoice.PayableAsset = options[0].Asset
	invoice.PayableAmount = options[0].PayableAmount
	invoice.DestinationAddress = options[0].DestinationAddress
	invoice.PaymentComment = options[0].PaymentComment
	invoice.MatchingSuffix = options[0].MatchingSuffix
}

func selectInvoicePaymentOption(invoice *Invoice, network Network, asset PaymentAsset) {
	network, asset = NormalizePaymentOption(network, asset)
	for _, option := range invoice.PaymentOptions {
		optionNetwork, optionAsset := NormalizePaymentOption(option.Network, option.Asset)
		if optionNetwork == network && optionAsset == asset {
			invoice.PayableNetwork = option.Network
			invoice.PayableAsset = option.Asset
			invoice.PayableAmount = option.PayableAmount
			invoice.DestinationAddress = option.DestinationAddress
			invoice.PaymentComment = option.PaymentComment
			invoice.MatchingSuffix = option.MatchingSuffix
			return
		}
	}
}

func (s *Store) ListPaymentOptionsForInvoice(ctx context.Context, invoiceID int64) ([]PaymentOption, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT `+paymentOptionSelectColumns+`
		FROM invoice_payment_options
		WHERE invoice_id = $1
		ORDER BY is_default DESC, id ASC
	`, invoiceID)
	if err != nil {
		return nil, fmt.Errorf("list invoice payment options: %w", err)
	}
	defer rows.Close()
	options := make([]PaymentOption, 0)
	for rows.Next() {
		option, err := scanPaymentOption(rows)
		if err != nil {
			return nil, err
		}
		options = append(options, option)
	}
	return options, rows.Err()
}

func (s *Store) attachPaymentOptions(ctx context.Context, invoices []Invoice) error {
	for i := range invoices {
		options, err := s.ListPaymentOptionsForInvoice(ctx, invoices[i].ID)
		if err != nil {
			return err
		}
		applyPaymentOptions(&invoices[i], options)
	}
	return nil
}

func prefixedInvoiceSelectColumns(alias string) string {
	prefix := strings.TrimSpace(alias) + "."
	columns := strings.Split(invoiceSelectColumns, ",")
	for i, column := range columns {
		columns[i] = prefix + strings.TrimSpace(column)
	}
	return strings.Join(columns, ", ")
}

func applyInvoicePostPaymentEffects(ctx context.Context, tx pgx.Tx, invoice Invoice) error {
	if invoice.Kind != InvoiceKindSubscription || invoice.SubscriptionDays <= 0 {
		return nil
	}
	return extendWorkspaceSubscriptionTx(ctx, tx, invoice.WorkspaceID, invoice.PlanCode, invoice.SubscriptionDays)
}

func extendWorkspaceSubscriptionTx(ctx context.Context, tx pgx.Tx, workspaceID int64, rawPlanCode PlanCode, days int) error {
	if days <= 0 {
		return nil
	}
	planCode := NormalizePlanCode(string(rawPlanCode))
	if planCode == PlanCodeTrial {
		planCode = PlanCodeMerchant
	}
	if _, err := tx.Exec(ctx, `
		UPDATE workspaces
		SET plan_code = $2,
		    subscription_ends_at = GREATEST(COALESCE(subscription_ends_at, NOW()), NOW()) + make_interval(days => $3),
		    discount_percent = 0,
		    discount_plan_code = NULL
		WHERE id = $1
	`, workspaceID, planCode, days); err != nil {
		return fmt.Errorf("extend workspace subscription: %w", err)
	}
	return nil
}

func insertInvoiceTransitionTx(ctx context.Context, tx pgx.Tx, invoice Invoice, from InvoiceStatus, to InvoiceStatus, reason string, paymentEventID int64, observedAmount decimal.Decimal, cumulativeAmount decimal.Decimal, actorType string, actorID string) (int64, error) {
	var id int64
	paymentEvent := any(nil)
	if paymentEventID > 0 {
		paymentEvent = paymentEventID
	}
	actor := any(nil)
	if strings.TrimSpace(actorID) != "" {
		actor = strings.TrimSpace(actorID)
	}
	if reason == "" {
		reason = "status_update"
	}
	if actorType == "" {
		actorType = "system"
	}
	if err := tx.QueryRow(ctx, `
		INSERT INTO invoice_state_transitions (
			invoice_id,
			workspace_id,
			from_status,
			to_status,
			reason,
			payment_event_id,
			observed_amount,
			cumulative_received_amount,
			actor_type,
			actor_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`, invoice.ID, invoice.WorkspaceID, from, to, reason, paymentEvent, observedAmount, cumulativeAmount, actorType, actor).Scan(&id); err != nil {
		return 0, fmt.Errorf("insert invoice transition: %w", err)
	}
	return id, nil
}

func buildInvoiceNotificationMessage(language string, invoice Invoice, classification string, observedAmount decimal.Decimal) string {
	copy := notificationCopyFor(language)
	received := observedAmount.StringFixed(payableScale(invoice.PayableNetwork))
	expected := invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork))

	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		planCode := NormalizePlanCode(string(invoice.PlanCode))
		if planCode == PlanCodeTrial {
			planCode = PlanCodeMerchant
		}
		plan := ResolvePlan(planCode)
		return fmt.Sprintf(copy.subscriptionActivated, plan.MarketingLabel, received, invoice.PayableNetwork, invoice.SubscriptionDays)
	}

	switch invoice.Status {
	case InvoiceStatusPaid:
		return fmt.Sprintf(copy.paymentConfirmed, invoice.PublicID, received, invoice.PayableNetwork)
	case InvoiceStatusUnderpaid:
		if classification == "underpaid_fee_window" {
			return fmt.Sprintf(copy.partialPayment, invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
		}
		return fmt.Sprintf(copy.underpaid, invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
	case InvoiceStatusOverpaid:
		return fmt.Sprintf(copy.overpaid, invoice.PublicID, received, invoice.PayableNetwork, expected, invoice.PayableNetwork)
	case InvoiceStatusManualReview:
		return fmt.Sprintf(copy.latePayment, invoice.PublicID, received, invoice.PayableNetwork)
	default:
		return fmt.Sprintf(copy.statusUpdated, invoice.PublicID, invoice.Status)
	}
}

func buildInvoiceNotificationPayload(language string, invoice Invoice, classification string) json.RawMessage {
	copy := notificationCopyFor(language)
	actions := make([]map[string]string, 0, 2)
	switch invoice.Status {
	case InvoiceStatusUnderpaid:
		actions = append(actions,
			map[string]string{"kind": "callback", "text": copy.actionCountAsPaid, "data": fmt.Sprintf("invoice:mark_paid:%d", invoice.ID)},
			map[string]string{"kind": "callback", "text": copy.actionWaitTopUp, "data": fmt.Sprintf("invoice:keep_underpaid:%d", invoice.ID)},
		)
	case InvoiceStatusOverpaid, InvoiceStatusManualReview:
		actions = append(actions,
			map[string]string{"kind": "callback", "text": copy.actionCountAsPaid, "data": fmt.Sprintf("invoice:mark_paid:%d", invoice.ID)},
			map[string]string{"kind": "callback", "text": copy.actionKeepReview, "data": fmt.Sprintf("invoice:keep_review:%d", invoice.ID)},
		)
	}
	if len(actions) == 0 {
		return MustJSON(map[string]any{
			"invoice_id": invoice.ID,
			"public_id":  invoice.PublicID,
			"plan_code":  invoice.PlanCode,
		})
	}
	return MustJSON(map[string]any{
		"invoice_id":      invoice.ID,
		"public_id":       invoice.PublicID,
		"plan_code":       invoice.PlanCode,
		"classification":  classification,
		"invoice_actions": actions,
	})
}

func enqueueWebhookEventsTx(ctx context.Context, tx pgx.Tx, invoice Invoice, classification string, observedAmount decimal.Decimal, transitionID int64) error {
	var workspace Workspace
	row := tx.QueryRow(ctx, `
		SELECT `+workspaceSelectColumns+`
		FROM workspaces
		WHERE id = $1
	`, invoice.WorkspaceID)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return fmt.Errorf("load workspace for webhook enqueue: %w", err)
	}

	plan := workspace.EffectivePlan(time.Now())
	if plan.WebhookRetries <= 0 {
		return nil
	}

	eventType := invoiceWebhookEventType(invoice)
	payload := MustJSON(map[string]any{
		"created_at":      time.Now().UTC(),
		"transition_id":   transitionID,
		"event":           eventType,
		"classification":  classification,
		"observed_amount": observedAmount.StringFixed(payableScale(invoice.PayableNetwork)),
		"invoice": map[string]any{
			"id":                  invoice.ID,
			"public_id":           invoice.PublicID,
			"kind":                invoice.Kind,
			"plan_code":           invoice.PlanCode,
			"title":               invoice.Title,
			"status":              invoice.Status,
			"payable_amount":      invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork)),
			"payable_network":     invoice.PayableNetwork,
			"destination_address": invoice.DestinationAddress,
			"payment_comment":     valueOrEmpty(invoice.PaymentComment),
			"tx_hash":             valueOrEmpty(invoice.TxHash),
			"paid_at":             invoice.PaidAt,
		},
		"sent_at": time.Now().UTC(),
	})
	if err := enqueueWebhookDeliveriesTx(ctx, tx, invoice.WorkspaceID, eventType, payload, plan.WebhookRetries); err != nil {
		return fmt.Errorf("enqueue invoice webhook deliveries: %w", err)
	}

	if invoice.Kind == InvoiceKindSubscription && invoice.Status == InvoiceStatusPaid {
		subscriptionPayload := MustJSON(map[string]any{
			"event": "subscription.activated",
			"plan": map[string]any{
				"code":         invoice.PlanCode,
				"name":         ResolvePlan(invoice.PlanCode).Name,
				"billing_days": invoice.SubscriptionDays,
			},
			"invoice_public_id": invoice.PublicID,
			"sent_at":           time.Now().UTC(),
		})
		if err := enqueueWebhookDeliveriesTx(ctx, tx, invoice.WorkspaceID, "subscription.activated", subscriptionPayload, plan.WebhookRetries); err != nil {
			return fmt.Errorf("enqueue subscription webhook deliveries: %w", err)
		}
	}
	return nil
}

func invoiceWebhookEventType(invoice Invoice) string {
	switch invoice.Status {
	case InvoiceStatusPaid:
		return "invoice.paid"
	case InvoiceStatusUnderpaid:
		return "invoice.underpaid"
	case InvoiceStatusOverpaid:
		return "invoice.overpaid"
	case InvoiceStatusManualReview:
		return "invoice.manual_review"
	case InvoiceStatusExpired:
		return "invoice.expired"
	default:
		return "invoice.updated"
	}
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func payableScale(network Network) int32 {
	switch network {
	case NetworkTON:
		return 6
	case NetworkTON_USDT, NetworkTRON, NetworkBASE, NetworkBSC:
		return 6
	default:
		return 6
	}
}

func (s *Store) RawPool() *pgxpool.Pool {
	return s.pool
}

func MustJSON(value any) json.RawMessage {
	raw, _ := json.Marshal(value)
	return raw
}

func (s *Store) SetBotBlockedByTelegramID(ctx context.Context, telegramID int64, blocked bool) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE workspaces
		SET bot_blocked = $2
		WHERE owner_telegram_id = $1
	`, telegramID, blocked)
	if err != nil {
		return fmt.Errorf("set bot blocked by telegram id: %w", err)
	}
	return nil
}

func (s *Store) GetEligibleTelegramBroadcastUsersCount(ctx context.Context) (int64, error) {
	var count int64
	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(1)
		FROM workspaces
		WHERE owner_telegram_id IS NOT NULL
		  AND is_blocked = FALSE
		  AND bot_blocked = FALSE
	`).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("get eligible telegram broadcast count: %w", err)
	}
	return count, nil
}

func (s *Store) CreateTelegramBroadcast(ctx context.Context, message string) (int64, error) {
	tag, err := s.pool.Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message)
		SELECT id, owner_telegram_id, $1
		FROM workspaces
		WHERE owner_telegram_id IS NOT NULL
		  AND is_blocked = FALSE
		  AND bot_blocked = FALSE
	`, message)
	if err != nil {
		return 0, fmt.Errorf("create telegram broadcast: %w", err)
	}
	return tag.RowsAffected(), nil
}

func (s *Store) GetRetentionCandidates(ctx context.Context) ([]WorkspaceRetentionCandidate, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT
			w.id,
			w.owner_telegram_id,
			COALESCE(w.language, 'en'),
			w.created_at,
			w.last_retention_reminder_at,
			w.retention_stage,
			(SELECT COUNT(1) FROM wallets WHERE workspace_id = w.id AND is_active = TRUE) as wallet_count,
			(SELECT COUNT(1) FROM invoices WHERE workspace_id = w.id) as invoice_count,
			(SELECT COUNT(1) FROM invoices WHERE workspace_id = w.id AND status = 'paid') as paid_invoice_count,
			(SELECT MAX(created_at) FROM invoices WHERE workspace_id = w.id) as last_invoice_created_at,
			w.free_invoices_used,
			w.plan_code
		FROM workspaces w
		WHERE w.owner_telegram_id IS NOT NULL
		  AND w.is_blocked = FALSE
		  AND w.bot_blocked = FALSE
		  AND (w.last_retention_reminder_at IS NULL OR w.last_retention_reminder_at <= NOW() - INTERVAL '24 hours')
	`)
	if err != nil {
		return nil, fmt.Errorf("query retention candidates: %w", err)
	}
	defer rows.Close()

	var candidates []WorkspaceRetentionCandidate
	for rows.Next() {
		var c WorkspaceRetentionCandidate
		var ownerTelegramID sql.NullInt64
		err := rows.Scan(
			&c.ID,
			&ownerTelegramID,
			&c.Language,
			&c.CreatedAt,
			&c.LastRetentionReminderAt,
			&c.RetentionStage,
			&c.WalletCount,
			&c.InvoiceCount,
			&c.PaidInvoiceCount,
			&c.LastInvoiceCreatedAt,
			&c.FreeInvoicesUsed,
			&c.PlanCode,
		)
		if err != nil {
			return nil, fmt.Errorf("scan retention candidate: %w", err)
		}
		if ownerTelegramID.Valid {
			c.OwnerTelegramID = ownerTelegramID.Int64
			candidates = append(candidates, c)
		}
	}
	return candidates, rows.Err()
}

func (s *Store) UpdateWorkspaceRetention(ctx context.Context, workspaceID int64, stage string) error {
	_, err := s.pool.Exec(ctx, `
		UPDATE workspaces
		SET last_retention_reminder_at = NOW(),
		    retention_stage = $2
		WHERE id = $1
	`, workspaceID, stage)
	if err != nil {
		return fmt.Errorf("update workspace retention: %w", err)
	}
	return nil
}

func (s *Store) QueueRetentionReminder(ctx context.Context, workspaceID int64, recipientTelegramID int64, message string, payload json.RawMessage, stage string) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin retention reminder tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload)
		VALUES ($1, $2, $3, $4)
	`, workspaceID, recipientTelegramID, message, payload)
	if err != nil {
		return fmt.Errorf("insert notification outbox: %w", err)
	}

	_, err = tx.Exec(ctx, `
		UPDATE workspaces
		SET last_retention_reminder_at = NOW(),
		    retention_stage = $2
		WHERE id = $1
	`, workspaceID, stage)
	if err != nil {
		return fmt.Errorf("update workspace retention: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit retention reminder tx: %w", err)
	}
	return nil
}
