package middleware

import (
	"context"
	"regexp"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

var tokenCraftRequestIDPattern = regexp.MustCompile(`^tc_req_[A-Za-z0-9_-]{1,56}$`)

func captureTokenCraftRequestID(c *gin.Context) {
	requestID := c.GetHeader(common.TokenCraftRequestIdKey)
	traceID := c.GetHeader(common.TokenCraftTraceIdKey)
	state := "missing"
	if requestID != "" {
		switch {
		case !tokenCraftRequestIDPattern.MatchString(requestID):
			state = "invalid"
		case traceID != "" && traceID != requestID:
			state = "conflict"
		default:
			state = "captured"
			c.Set(common.TokenCraftRequestIdKey, requestID)
		}
	}
	c.Set(common.TokenCraftRequestStateKey, state)
}

func RequestId() func(c *gin.Context) {
	return func(c *gin.Context) {
		captureTokenCraftRequestID(c)
		id := common.NewRequestId()
		c.Set(common.RequestIdKey, id)
		ctx := context.WithValue(c.Request.Context(), common.RequestIdKey, id)
		c.Request = c.Request.WithContext(ctx)
		c.Header(common.RequestIdKey, id)
		c.Next()
	}
}
