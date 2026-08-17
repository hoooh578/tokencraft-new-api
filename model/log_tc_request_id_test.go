package model

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestLogPersistsTokenCraftRequestFields(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&Log{}))

	captured := "tc_req_durable_1"
	require.NoError(t, db.Create(&Log{Type: LogTypeConsume, TcRequestId: &captured, TcRequestIdState: "captured"}).Error)
	require.NoError(t, db.Create(&Log{Type: LogTypeConsume, TcRequestIdState: "missing"}).Error)
	require.NoError(t, db.Create(&Log{Type: LogTypeConsume, TcRequestIdState: "invalid"}).Error)
	require.NoError(t, db.Create(&Log{Type: LogTypeConsume, TcRequestIdState: "conflict"}).Error)

	var logs []Log
	require.NoError(t, db.Order("id").Find(&logs).Error)
	require.Len(t, logs, 4)
	assert.Equal(t, "captured", logs[0].TcRequestIdState)
	require.NotNil(t, logs[0].TcRequestId)
	assert.Equal(t, captured, *logs[0].TcRequestId)
	for _, log := range logs[1:] {
		assert.Nil(t, log.TcRequestId)
	}
	assert.Equal(t, []string{"missing", "invalid", "conflict"}, []string{logs[1].TcRequestIdState, logs[2].TcRequestIdState, logs[3].TcRequestIdState})
}
