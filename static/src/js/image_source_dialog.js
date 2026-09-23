/** @odoo-module **/

import { Dialog } from "@web/core/dialog/dialog";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillDestroy, useRef, useState } from "@odoo/owl";

export class ImageSourceDialog extends Component {
    static template = "image_camera_upload.ImageSourceDialog";
    static components = { Dialog };
    static props = {
        acceptedFileExtensions: { type: String, optional: true },
        onUpload: Function,
        onCaptured: Function,
        close: Function,
    };

    setup() {
        this.notification = useService("notification");
        this.videoRef = useRef("video");
        this.canvasRef = useRef("canvas");
        this.cropAreaRef = useRef("cropArea");
        this.cropImageRef = useRef("cropImage");
        this.state = useState({
            mode: "choose",
            cameraStarting: false,
            cameraReady: false,
            confirming: false,
            error: "",
            previewUrl: "",
            crop: null,
        });
        this.stream = null;
        this.capturedInfo = null;
        this.cropStart = null;
        onWillDestroy(() => this.stopCamera());
    }

    get dialogTitle() {
        if (this.state.mode === "camera") {
            return "Take a picture";
        }
        if (this.state.mode === "crop") {
            return "Crop image";
        }
        if (this.state.mode === "preview") {
            return "Preview image";
        }
        return "Select image source";
    }

    get hasCropSelection() {
        return Boolean(this.state.crop?.width >= 2 && this.state.crop?.height >= 2);
    }

    get cropSelectionStyle() {
        const crop = this.state.crop;
        if (!crop) {
            return "display: none;";
        }
        return `left: ${crop.left}px; top: ${crop.top}px; width: ${crop.width}px; height: ${crop.height}px;`;
    }

    chooseUpload() {
        this.props.onUpload();
        this.props.close();
    }

    async chooseCamera() {
        this.stopCamera();
        if (!navigator.mediaDevices?.getUserMedia) {
            this.state.error = "Camera access is not available in this browser.";
            return;
        }
        this.state.mode = "camera";
        this.state.cameraStarting = true;
        this.state.cameraReady = false;
        this.state.error = "";
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });
            this.videoRef.el.srcObject = this.stream;
            await this.videoRef.el.play();
            this.state.cameraReady = true;
        } catch (error) {
            this.state.error = "Camera access was denied or could not be started.";
            this.notification.add(this.state.error, { type: "warning" });
        } finally {
            this.state.cameraStarting = false;
        }
    }

    backToChoices() {
        this.stopCamera();
        this.capturedInfo = null;
        this.cropStart = null;
        this.state.mode = "choose";
        this.state.cameraReady = false;
        this.state.previewUrl = "";
        this.state.crop = null;
        this.state.error = "";
    }

    async capture() {
        if (!this.state.cameraReady || !this.videoRef.el.videoWidth) {
            return;
        }
        const video = this.videoRef.el;
        const canvas = this.canvasRef.el;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) {
            this.state.error = "The image could not be captured.";
            return;
        }
        const data = await this.readBlobAsBase64(blob);
        this.capturedInfo = {
            name: `camera_${new Date().toISOString().replace(/[.:]/g, "-")}.jpg`,
            size: blob.size,
            type: "image/jpeg",
            data,
            objectUrl: null,
        };
        this.stopCamera();
        this.state.previewUrl = `data:image/jpeg;base64,${data}`;
        this.state.mode = "preview";
        this.state.cameraReady = false;
        this.state.crop = null;
        this.state.error = "";
    }

    enterCrop() {
        this.state.mode = "crop";
        this.state.crop = null;
        this.state.error = "";
    }

    cancelCrop() {
        this.cropStart = null;
        this.state.mode = "preview";
        this.state.crop = null;
        this.state.error = "";
    }

    getCropPoint(event) {
        const rect = this.cropAreaRef.el.getBoundingClientRect();
        return {
            x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
            y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
        };
    }

    startCrop(event) {
        if (this.state.mode !== "crop") {
            return;
        }
        event.preventDefault();
        const point = this.getCropPoint(event);
        this.cropStart = point;
        this.state.crop = { left: point.x, top: point.y, width: 0, height: 0 };
        this.cropAreaRef.el.setPointerCapture?.(event.pointerId);
    }

    updateCrop(event) {
        if (!this.cropStart || this.state.mode !== "crop") {
            return;
        }
        const point = this.getCropPoint(event);
        this.state.crop = {
            left: Math.min(this.cropStart.x, point.x),
            top: Math.min(this.cropStart.y, point.y),
            width: Math.abs(point.x - this.cropStart.x),
            height: Math.abs(point.y - this.cropStart.y),
        };
    }

    finishCrop(event) {
        if (!this.cropStart) {
            return;
        }
        this.updateCrop(event);
        this.cropStart = null;
        this.cropAreaRef.el.releasePointerCapture?.(event.pointerId);
    }

    async applyCrop() {
        if (!this.hasCropSelection || !this.cropImageRef.el?.naturalWidth) {
            return;
        }
        const image = this.cropImageRef.el;
        const imageRect = image.getBoundingClientRect();
        const crop = this.state.crop;
        const scaleX = image.naturalWidth / imageRect.width;
        const scaleY = image.naturalHeight / imageRect.height;
        const sourceX = Math.round(crop.left * scaleX);
        const sourceY = Math.round(crop.top * scaleY);
        const sourceWidth = Math.max(1, Math.round(crop.width * scaleX));
        const sourceHeight = Math.max(1, Math.round(crop.height * scaleY));
        const canvas = document.createElement("canvas");
        canvas.width = sourceWidth;
        canvas.height = sourceHeight;
        canvas.getContext("2d").drawImage(
            image,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            0,
            0,
            sourceWidth,
            sourceHeight
        );
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) {
            this.state.error = "The cropped image could not be created.";
            return;
        }
        const data = await this.readBlobAsBase64(blob);
        this.capturedInfo = {
            ...this.capturedInfo,
            size: blob.size,
            type: "image/jpeg",
            data,
        };
        this.state.previewUrl = `data:image/jpeg;base64,${data}`;
        this.state.mode = "preview";
        this.state.crop = null;
        this.state.error = "";
    }

    async retake() {
        this.capturedInfo = null;
        this.state.previewUrl = "";
        this.state.crop = null;
        await this.chooseCamera();
    }

    async confirmCapture() {
        if (!this.capturedInfo || this.state.confirming) {
            return;
        }
        this.state.confirming = true;
        try {
            await this.props.onCaptured(this.capturedInfo);
            this.props.close();
        } finally {
            this.state.confirming = false;
        }
    }

    readBlobAsBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    onCropImageLoad() {
        this.state.error = "";
    }

    stopCamera() {
        if (this.stream) {
            for (const track of this.stream.getTracks()) {
                track.stop();
            }
            this.stream = null;
        }
        if (this.videoRef.el) {
            this.videoRef.el.srcObject = null;
        }
    }
}
