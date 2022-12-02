import { ApplicationError } from "@/protocols";

export function cannotBookRoomError(): ApplicationError {
  return {
    name: "CannotBookRoomError",
    message: "Cannot book room!",
  };
}
