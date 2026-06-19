const bedrock = require('bedrock-protocol')

const CONFIG = {
  host: 'pengangguran.aternos.me',
  port: 19148,
  username: 'Chacha ninggolan',
  offline: false,
    version: '1.26.20',
}

const RECONNECT_DELAY_MS = 5000
const MOVE_INTERVAL_MS = 25000

let client = null
let moveTimer = null
let reconnectTimer = null
let isConnected = false

function log(msg) {
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  console.log(`[${now}] ${msg}`)
}

function stopMovement() {
  if (moveTimer) { clearInterval(moveTimer); moveTimer = null }
}

function startAntiAFK() {
  stopMovement()
  let step = 0
  const directions = [
    { x: 0.3, z: 0 }, { x: 0, z: 0.3 },
    { x: -0.3, z: 0 }, { x: 0, z: -0.3 },
  ]
  moveTimer = setInterval(() => {
    if (!client || !isConnected) return
    const dir = directions[step % directions.length]
    step++
    try {
      client.write('player_action', {
        runtime_id: BigInt(1), action: 0,
        position: { x: 0, y: 0, z: 0 },
        result_position: { x: 0, y: 0, z: 0 }, face: 0,
      })
      log(`Anti-AFK: langkah ke-${step}`)
    } catch (err) { log(`Anti-AFK error: ${err.message}`) }
  }, MOVE_INTERVAL_MS)
}

function connect() {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  log(`Menghubungkan ke ${CONFIG.host}:${CONFIG.port} sebagai "${CONFIG.username}"...`)
  try { client = bedrock.createClient(CONFIG) }
  catch (err) { log(`Gagal buat client: ${err.message}`); scheduleReconnect(); return }

  client.on('spawn', () => {
    isConnected = true
    log('✅ Bot berhasil masuk ke server!')
    log('🔄 Anti-AFK aktif')
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

process.on('SIGINT', () => { log('Bot dihentikan.'); stopMovement(); if (client) client.close(); process.exit(0) })
process.on('uncaughtException', (err) => { log(`Exception: ${err.message}`); scheduleReconnect() })
process.on('unhandledRejection', (r) => { log(`Rejection: ${r}`) })

log('=== Bot Chacha Ninggolan ===')
log(`Server: ${CONFIG.host}:${CONFIG.port}`)
connect()
