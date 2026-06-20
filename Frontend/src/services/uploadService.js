import api from "./api";

export function uploadImage(file) {
  const data = new FormData();
  data.append("image", file);
  return api.post("/upload", data);
}
