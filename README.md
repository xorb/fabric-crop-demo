# Fabric cropped

```ts
// add image
fabric.Image.fromURL("url", (original) => {
  fabric.Image.fromURL(original.toDataURL, (cropped) => {
    cropped._original = original;
    canvas.add(cropped);
  });
});

// init crop
const image = canvas.getActiveObject();
const original = image._original;
const cropper = new fabric.Path();

fabric.Image.fromURL(original, (background) => {
  canvas.add(background);
  image.clipPath = cropper;
  canvas.add(cropper);
});

// Apply crop
```
