import io from "socket.io-client";

export const socket = io(import.meta.env.VITE_API_URL, { autoConnect: false });

export async function request(event, payload) {
  let response;
  try {
    response = await socket.timeout(5000).emitWithAck(event, payload);
  } catch {
    throw new Error("Сервер не ответил, проверьте соединение");
  }
  if (response.error) {
    throw new Error(response.error);
  }
  return response;
}
