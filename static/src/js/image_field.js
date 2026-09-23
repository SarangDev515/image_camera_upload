/** @odoo-module **/

import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { ImageField, imageField } from "@web/views/fields/image/image_field";
import { FileUploader } from "@web/views/fields/file_handler";
import { Component } from "@odoo/owl";

import { ImageSourceDialog } from "./image_source_dialog";

export class CameraImageField extends ImageField {
    static template = "image_camera_upload.CameraImageField";
    static components = { FileUploader };

    setup() {
        super.setup();
        this.dialog = useService("dialog");
    }

    openSourceDialog(event) {
        const uploader = event.currentTarget.closest(".o_image_uploader_container");
        const fileInput = uploader?.querySelector('input[type="file"]');
        this.dialog.add(ImageSourceDialog, {
            acceptedFileExtensions: this.props.acceptedFileExtensions,
            onUpload: () => fileInput?.click(),
            onCaptured: (info) => this.onFileUploaded(info),
        });
        return false;
    }
}

const cameraImageField = {
    ...imageField,
    component: CameraImageField,
};

registry.category("fields").add("image", cameraImageField, { force: true });
