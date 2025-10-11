// =============================================================================
// ОТПРАВКА СОБЫТИЙ НА СЕРВЕР
// =============================================================================

// Присоединение к комнате
socket.emit('join', {
room: 'room_123',
name: 'User Name'
});

// WebRTC сигнализация
socket.emit('offer', sdp_offer);
socket.emit('answer', sdp_answer);
socket.emit('candidate', ice_candidate);

// =============================================================================
// ПРОСЛУШИВАНИЕ СОБЫТИЙ ОТ СЕРВЕРА
// =============================================================================

// Получение списка пользователей (только для нового пользователя)
socket.on('room_users', (users) => {
console.log('👥 Existing users in room:', users);
});

// Новый пользователь присоединился (для всех существующих пользователей)
socket.on('user_joined', (user) => {
console.log('✅ New user joined:', user);
// user = {id: 'socket_id', name: 'user_name'}
});

// Пользователь покинул комнату
socket.on('user_left', (user) => {
console.log('🚪 User left:', user);
// user = {id: 'socket_id', name: 'user_name'}
});

// WebRTC события
socket.on('getOffer', (sdp) => { /_ ... _/ });
socket.on('getAnswer', (sdp) => { /_ ... _/ });
socket.on('getCandidate', (candidate) => { /_ ... _/ });
