package docs

import "testing"

func TestSwaggerInfoIsRegisteredShape(t *testing.T) {
	if SwaggerInfo.Title == "" || SwaggerInfo.BasePath != "/v1" || SwaggerInfo.InstanceName() == "" {
		t.Fatalf("unexpected SwaggerInfo: %+v", SwaggerInfo)
	}
}
