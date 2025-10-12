curl http://localhost:8000/
Response: {"status": "WebRTC Signaling Server", "version": "1.0"}
GET /rooms
Получить информацию о комнатах
bashcurl http://localhost:8000/rooms
Response: {"rooms": {"room_123": ["Alice", "Bob"]}, "total_rooms": 1, "total_users": 2}

Socket.IO Events
CLIENT → SERVER
connect - Автоматическое событие при подключении
javascriptsocket.on('connect', () => console.log(socket.id));
join - Присоединиться к комнате
javascriptsocket.emit('join', { room: 'room_123', name: 'Alice' });
offer - Отправить WebRTC offer
javascriptsocket.emit('offer', {
target: 'user_socket_id',
sdp: { type: 'offer', sdp: 'v=0...' }
});
answer - Отправить WebRTC answer
javascriptsocket.emit('answer', {
target: 'user_socket_id',
sdp: { type: 'answer', sdp: 'v=0...' }
});
candidate - Отправить ICE candidate
javascriptsocket.emit('candidate', {
target: 'user_socket_id',
candidate: { candidate: 'candidate:1...', sdpMLineIndex: 0 }
});
leave - Покинуть комнату
javascriptsocket.emit('leave', { room: 'room_123' });
disconnect - Отключиться
javascriptsocket.disconnect();

SERVER → CLIENT
room*users - Список пользователей в комнате (приходит новому пользователю)
javascriptsocket.on('room_users', (data) => {
console.log(data.users); // [{ id: 'sid1', name: 'Bob' }]
});
user_joined - Новый пользователь присоединился (приходит всем в комнате)
javascriptsocket.on('user_joined', (data) => {
console.log(data.user); // { id: 'sid3', name: 'Alice' }
});
user_left - Пользователь покинул комнату
javascriptsocket.on('user_left', (data) => {
console.log(data.user); // { id: 'sid1', name: 'Bob' }
});
getOffer - Получен WebRTC offer
javascriptsocket.on('getOffer', (data) => {
console.log(data.sdp); // { type: 'offer', sdp: '...' }
console.log(data.sender); // 'sid*отправителя'
});
getAnswer - Получен WebRTC answer
javascriptsocket.on('getAnswer', (data) => {
console.log(data.sdp); // { type: 'answer', sdp: '...' }
console.log(data.sender); // 'sid*отправителя'
});
getCandidate - Получен ICE candidate
javascriptsocket.on('getCandidate', (data) => {
console.log(data.candidate); // { candidate: '...', sdpMLineIndex: 0 }
console.log(data.sender); // 'sid*отправителя'
});
error - Ошибка (например, не указан room ID)
javascriptsocket.on('error', (data) => {
console.log(data.message); // 'Room ID is required'
});

```

```
