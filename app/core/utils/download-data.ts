export function downloadData(
  data: string | ArrayBuffer | Blob,
  name: string,
  type: string,
  extension: string | null = null,
) {
  let blob = null;
  if (!(data instanceof Blob)) {
    blob = new Blob([data], { type });
  } else {
    blob = data;
  }
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = extension ? extension : type.split('/')[1];
  let fileName = name;
  const hasExt = name.split('.')[1] === ext;
  if (ext && !hasExt) {
    fileName += `.${ext}`;
  }
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
