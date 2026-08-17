package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRequestIDCapturesTokenCraftIdentityState(t *testing.T) {
	cases := []struct {
		name, requestID, traceID, wantState, wantID string
	}{
		{"captured", "tc_req_direct_1", "tc_req_direct_1", "captured", "tc_req_direct_1"},
		{"missing", "", "", "missing", ""},
		{"invalid", "caller-controlled", "caller-controlled", "invalid", ""},
		{"conflict", "tc_req_direct_1", "tc_req_other", "conflict", ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
			ctx.Request = httptest.NewRequest("POST", "/v1/chat/completions", nil)
			ctx.Request.Header.Set(common.TokenCraftRequestIdKey, tc.requestID)
			ctx.Request.Header.Set(common.TokenCraftTraceIdKey, tc.traceID)
			RequestId()(ctx)
			assert.Equal(t, tc.wantState, ctx.GetString(common.TokenCraftRequestStateKey))
			assert.Equal(t, tc.wantID, ctx.GetString(common.TokenCraftRequestIdKey))
			assert.NotEmpty(t, ctx.GetString(common.RequestIdKey))
		})
	}
}
