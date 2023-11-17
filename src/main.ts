import './style.css';
console.clear();

const fileInputRef: HTMLInputElement | null = document.getElementById('file-input') as HTMLInputElement | null;
const previewRef: HTMLInputElement | null = document.getElementById('preview') as HTMLInputElement | null;
const formRef: HTMLFormElement | null = document.getElementById('uploadForm') as HTMLFormElement | null;

interface Base53Result {
  name: string;
  target: string;
}

if (fileInputRef === null) {
  throw new Error('File input element not found');
}

fileInputRef.addEventListener('change', async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const fileList: FileList | null = target.files;

  if (fileList === null) {
    return new Error('File list is null');
  }
  const promises = Array.from(fileList).map((file) => getBase64(file));

  Promise.all(promises).then((imagesAsBase64: Base53Result[]) => {
    for (const image of imagesAsBase64) {
      const imageElement: HTMLImageElement = document.createElement('img');
      imageElement.setAttribute('src', image.target);
      imageElement.setAttribute('id', image.name);
      imageElement.classList.add('image-preview');
      previewRef?.appendChild(imageElement);
    }
  });
});

if (formRef === null) {
  throw new Error('Form element not found');
}

formRef.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  const formData: FormData = new FormData(formRef);

  fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData
  })
    .then((response) => response.json())
    .then(result => {
      result.forEach((image: Base53Result) => {
        const imageElement: HTMLImageElement = document.getElementById(Object.keys(image) as string) as HTMLImageElement;
        imageElement.setAttribute('src', Object.values(image) as string);
      });
    })
})


function getBase64(file: File): Promise<Base53Result> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('load', (event) => {
      if (event.target && event.target.result) {
        resolve({
          name: file.name.replace(' ', '_'),
          target: event.target.result as string,
        });
      }
    });
    fileReader.addEventListener('error', (event) => {
      reject(event);
    });
    fileReader.readAsDataURL(file);
  });
}
