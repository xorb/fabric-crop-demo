// @ts-nocheck
import { fabric } from "fabric";
import { useCallback, useEffect } from "react";
import useCanvasContext from "./hooks/useCanvasContext";

function rotatedPoint(point, angle, center) {
  angle = (Math.PI / 180) * angle;
  return {
    x:
      (point.x - center.x) * Math.cos(angle) -
      (point.y - center.y) * Math.sin(angle) +
      center.x,
    y:
      (point.x - center.x) * Math.sin(angle) +
      (point.y - center.y) * Math.cos(angle) +
      center.y,
  };
}

function App() {
  const { setCanvas, canvas } = useCanvasContext();

  useEffect(() => {
    const canvas = new fabric.Canvas("canvas", {
      width: 1400,
      height: 800,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    });
    setCanvas(canvas);
  }, []);

  const addImage = useCallback(() => {
    if (canvas) {
      fabric.Image.fromURL(
        "https://i.ibb.co/JB3y2ts/mclogo.jpg",
        (original) => {
          original.set({
            id: "original",
            state: "xxx",
          });
          const cropInfo = {
            top: 0,
            left: 0,
            width: original.width,
            height: original.height,
            initiated: false,
          };
          fabric.Image.fromURL(original.toDataURL(), (cropped) => {
            cropped._original = original;
            cropped._cropInfo = cropInfo;
            canvas.add(cropped);
          });
        },
        { crossOrigin: "anonymous" }
      );
    }
  }, [canvas]);

  const initCrop = useCallback(() => {
    if (canvas) {
      const cropped = canvas.getActiveObject();
      const cropInfo = cropped._cropInfo;
      const original = cropped._original;
      const np = rotatedPoint(
        {
          x: cropped.left - cropInfo.left * cropped.scaleX,
          y: cropped.top - cropInfo.top * cropped.scaleY,
        },
        cropped.angle - original.angle,
        { x: cropped.left, y: cropped.top }
      );

      fabric.Image.fromURL(cropped._original.toDataURL(), (background) => {
        fabric.Image.fromURL(cropped._original.toDataURL(), (nextCropped) => {
          background.set({
            id: "background",
            state: "xxx",
            left: np.x,
            top: np.y,
            width: original.width,
            height: original.height,
            scaleX: cropped.scaleX,
            scaleY: cropped.scaleY,
            angle: cropped.angle,
          });

          nextCropped.set({
            id: "cropped",
            state: "cropped",
            left: np.x,
            top: np.y,
            width: original.width,
            height: original.height,
            scaleX: cropped.scaleX,
            scaleY: cropped.scaleY,
            angle: cropped.angle,
          });

          const cropper = new fabric.Rect({
            id: "cropper",
            state: "xxx",
            top: 0,
            left: 0,
            absolutePositioned: true,
            backgroundColor: "rgba(0,0,0,0)",
            opacity: 0.00001,
          });

          cropper.set({
            top: cropped.top,
            left: cropped.left,
            width: cropped.width,
            height: cropped.height,
            scaleX: cropped.scaleX,
            scaleY: cropped.scaleY,
            angle: cropped.angle,
          });

          cropper.setControlsVisibility({
            mtr: false,
            mt: false,
            ml: false,
            mr: false,
            mb: false,
          });

          nextCropped.clipPath = cropper;

          const overlay = new fabric.Rect({
            id: "overlay",
            state: "xxx",
            width: 1400,
            height: 800,
            fill: "#000000",
            opacity: 0.25,
            selectable: false,
            evented: false,
          });

          canvas.add(background);
          canvas.add(overlay);
          canvas.add(nextCropped);
          canvas.add(cropper);
          nextCropped.bringToFront();
          cropper.bringToFront();
          canvas.requestRenderAll();
          cropper._original = original;
          cropper._cropped = nextCropped;
          canvas.remove(cropped);
          canvas.setActiveObject(cropper);
        });
      });
    }
  }, [canvas]);

  const applyCrop = useCallback(() => {
    if (canvas) {
      const cropper = canvas.getActiveObject();
      const original = cropper._original;
      const cropped = cropper._cropped;
      const sX = cropped.scaleX;
      const sY = cropped.scaleY;

      original.set({
        angle: 0,
        scaleX: sX,
        scaleY: sY,
      });

      cropper.set({
        width: cropper.width * cropper.scaleX, //this.width * this.scaleX
        height: cropper.height * cropper.scaleY,
        scaleX: 1,
        scaleY: 1,
      });

      canvas.remove(cropped);
      original.set({
        scaleX: 1,
        scaleY: 1,
        top: cropped.top,
        left: cropped.left,
      });

      const np = rotatedPoint(
        { x: cropper.left, y: cropper.top },
        -cropper.angle,
        { x: original.left, y: original.top }
      );

      const cropInfo = {
        top: (np.y - original.top) / sY,
        left: (np.x - original.left) / sX,
        width: cropper.width / cropped.scaleX,
        height: cropper.height / cropped.scaleY,
      };

      fabric.Image.fromURL(original.toDataURL(cropInfo), (cropped) => {
        cropped.set({
          left: cropper.left,
          top: cropper.top,
          angle: cropper.angle,
          lockScalingFlip: true,
          scaleX: sX,
          scaleY: sY,
          width: cropper.width / sX,
          height: cropper.height / sY,
        });
        cropped._original = original;

        cropped._cropInfo = { ...cropInfo, initiated: true };
        canvas.add(cropped);
        canvas.getObjects().forEach((o) => {
          if (o.state === "xxx") {
            canvas.remove(o);
          }
        });
      });
    }
  }, [canvas]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F4F4F4",
      }}
    >
      <div
        style={{
          height: "80px",
          backgroundColor: "#000000",
          display: "flex",
          alignItems: "center",
          padding: "0 1rem",
          gap: "0.5rem",
        }}
      >
        <button
          onClick={addImage}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "none",
            padding: "1rem",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Add Image
        </button>
        <button
          onClick={initCrop}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "none",
            padding: "1rem",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Crop
        </button>
        <button
          onClick={applyCrop}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "none",
            padding: "1rem",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          Apply
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <canvas id="canvas"></canvas>
      </div>
    </div>
  );
}

export default App;
