package store

import (
	"encoding/json"
	"testing"
)

func TestPayloadTransitionID(t *testing.T) {
	cases := []struct {
		name    string
		payload json.RawMessage
		want    int64
	}{
		{
			name:    "valid object with transition_id",
			payload: json.RawMessage(`{"transition_id": 12345}`),
			want:    12345,
		},
		{
			name:    "valid object without transition_id",
			payload: json.RawMessage(`{"other_field": "value"}`),
			want:    0,
		},
		{
			name:    "object with wrong type for transition_id",
			payload: json.RawMessage(`{"transition_id": "12345"}`),
			want:    0,
		},
		{
			name:    "empty object",
			payload: json.RawMessage(`{}`),
			want:    0,
		},
		{
			name:    "json array",
			payload: json.RawMessage(`[1, 2, 3]`),
			want:    0,
		},
		{
			name:    "empty json array",
			payload: json.RawMessage(`[]`),
			want:    0,
		},
		{
			name:    "invalid json string",
			payload: json.RawMessage(`invalid json`),
			want:    0,
		},
		{
			name:    "nil payload",
			payload: nil,
			want:    0,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := payloadTransitionID(tc.payload)
			if got != tc.want {
				t.Errorf("payloadTransitionID(%q) = %v, want %v", string(tc.payload), got, tc.want)
			}
		})
	}
}
