const bedrock = require('bedrock-protocol')

const CONFIG = {
  host: 'pengangguran.aternos.me',
  port: 19148,
  username: 'Chacha ninggolan',
  offline: true,
  version: '1.26.20',
}

const RECONNECT_DELAY_MS = 5000
const MOVE_INTERVAL_MS = 30000
let client = null
let moveTimer = null
let reconnectTimer = null
let isConnected = false
let menit = 0

function log(msg) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  console.log(`[${now}] ${msg}`)
}

function stopMovement() {
  if (moveTimer) { clearInterval(moveTimer); moveTimer = null }
}

function startAntiAFK() {
  stopMovement(); menit = 0
  moveTimer = setInterval(() => {
    if (!client || !isConnected) return
    menit++
    log(`✅ Bot aktif di server — sudah ${menit} menit`)
  }, MOVE_INTERVAL_MS)
}

function connect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  log(`Menghubungkan ke ${CONFIG.host}:${CONFIG.port} sebagai "${CONFIG.username}"...`)
  try { client = bedrock.createClient(CONFIG) }
  catch (err) { log(`Gagal: ${err.message}`); scheduleReconnect(); return }

  client.on('spawn', () => {
    isConnected = true
    log('✅ Bot berhasil masuk ke server!')
    log('🔄 Server Aternos tidak akan tutup selama bot online')
    startAntiAFK()
  })
  client.on('text', (p) => log(`💬 Chat: ${p.message || ''}`))
  client.on('disconnect', (r) => {
    isConnected = false; stopMovement()
    log(`⚠️ Terputus: ${JSON.stringify(r)}`); scheduleReconnect()
  })
  client.on('error', (err) => {
    isConnected = false; stopMovement()
    log(`❌ Error: ${err.message}`); scheduleReconnect()
  })
  client.on('close', () => {
    isConnected = false; stopMovement()
    log('🔌 Koneksi ditutup'); scheduleReconnect()
  })
}

function scheduleReconnect() {
  if (reconnectTimer) return
  log(`⏳ Reconnect dalam ${RECONNECT_DELAY_MS / 1000} detik...`)
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect() }, RECONNECT_DELAY_MS)
}

process.on('SIGINT', () => { stopMovement(); if (client) client.close(); process.exit(0) })
process.on('uncaughtException', (err) => { log(`Exception: ${err.message}`); scheduleReconnect() })
process.on('unhandledRejection', (r) => { log(`Rejection: ${r}`) })

log('=== Bot Chacha Ninggolan ===')
log(`Server: ${CONFIG.host}:${CONFIG.port} | Versi: ${CONFIG.version}`)
connect()
