const MAX_BYTES = 20 * 1024 * 1024;
const supported = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "application/pdf"]);

/** null significa arquivo válido; uma string descreve a falha ao administrador. */
export function validateMaterialUpload(file, bytes) {
  if (!file || !bytes || !file.size || bytes.byteLength === 0) return "Informe um arquivo não vazio.";
  if (file.size > MAX_BYTES || bytes.byteLength > MAX_BYTES) return "Arquivo acima de 20 MB.";
  if (!supported.has(file.type)) return "Formato não permitido. Envie imagem, vídeo MP4/WebM ou PDF.";
  const data = Buffer.from(bytes);
  let valid = false;
  if (file.type === "application/pdf") valid = data.subarray(0, 5).toString("ascii") === "%PDF-";
  else if (file.type === "image/png") valid = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  else if (file.type === "image/jpeg") valid = data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255;
  else if (file.type === "image/gif") valid = ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii"));
  else if (file.type === "image/webp") valid = data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP";
  else if (file.type === "video/mp4") valid = data.subarray(4, 8).toString("ascii") === "ftyp";
  else if (file.type === "video/webm") valid = data.subarray(0, 4).equals(Buffer.from([26,69,223,163]));
  return valid ? null : "O conteúdo do arquivo não corresponde ao formato informado.";
}
