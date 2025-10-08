const socket = io('http://localhost:3001');

// Создание комнаты
socket.emit('create-room', {
roomId: 'room123',
userId: 'user456',
userData: { name: 'Иван', type: 'host' },
settings: {
maxUsers: 10,
isPublic: true
}
});

// Присоединение к существующей комнате
socket.emit('join-room', {
roomId: 'room123',
userId: 'user456',
userData: { name: 'Иван', type: 'participant' }
});

// Выход из комнаты
socket.emit('leave-room');

// Отправка оффера
socket.emit('offer', {
targetUserId: 'targetUser123',
offer: offer // RTCSessionDescription
});

// Отправка ответа
socket.emit('answer', {
targetUserId: 'targetUser123',
answer: answer // RTCSessionDescription
});

// Отправка ICE кандидата
socket.emit('ice-candidate', {
targetUserId: 'targetUser123',
candidate: candidate // RTCIceCandidate
});

// Отправка сообщения
socket.emit('chat-message', {
message: 'Привет!',
roomId: 'room123'
});

// Активность пользователя
socket.emit('user-activity', {
activity: 'typing' // или 'joined', 'left' и т.д.
});

// Пинг для проверки соединения
socket.emit('ping');

// События от сервера

// Успешное создание/присоединение к комнате
socket.on('room-joined', (data) => {
console.log('Присоединились к комнате:', data);
// data содержит: roomId, usersInRoom, yourId, roomSettings
});

// Новый пользователь присоединился
socket.on('user-joined', (data) => {
console.log('Новый пользователь:', data);
// data содержит: userId, userData, usersInRoom
});

// Пользователь покинул комнату
socket.on('user-left', (data) => {
console.log('Пользователь вышел:', data);
// data содержит: userId, reason
});

// WebRTC события
socket.on('offer', (data) => {
// Обработка входящего оффера
// data содержит: offer, fromUserId
console.log('Получен offer от:', data.fromUserId);
});

socket.on('answer', (data) => {
// Обработка входящего ответа
// data содержит: answer, fromUserId
console.log('Получен answer от:', data.fromUserId);
});

socket.on('ice-candidate', (data) => {
// Обработка ICE кандидата
// data содержит: candidate, fromUserId
console.log('Получен ICE candidate от:', data.fromUserId);
});

// Сообщения чата
socket.on('chat-message', (data) => {
console.log('Новое сообщение:', data);
// data содержит: id, userId, message, timestamp, userData
});

// Ошибки
socket.on('error', (data) => {
console.error('Ошибка:', data);
// data содержит: message
});

// Понг для проверки соединения
socket.on('pong', (data) => {
console.log('Понг получен:', data);
// data содержит: timestamp
});

// Дополнительные события для активности пользователей
socket.on('user-activity', (data) => {
console.log('Активность пользователя:', data);
// data содержит: userId, activity, timestamp
});
