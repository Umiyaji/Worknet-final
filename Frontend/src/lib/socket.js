import { io } from "socket.io-client";

let socket;

const getSocketUrl = () => {
	const backendUrl = import.meta.env.VITE_BACKEND_URL;
	return backendUrl || window.location.origin;
};

export const connectSocket = () => {
	if (socket?.connected) {
		return socket;
	}

	if (!socket) {
		socket = io(getSocketUrl(), {
			withCredentials: true,
			transports: ["websocket", "polling"],
		});
	}

	if (!socket.connected) {
		socket.connect();
	}

	return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
	if (!socket) {
		return;
	}

	socket.disconnect();
	socket = null;
};
