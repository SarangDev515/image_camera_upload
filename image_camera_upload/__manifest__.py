{
    'name': 'Image Upload or Camera',
    'summary': 'Choose between uploading an image and capturing one with the camera.',
    'description': """
Adds a source-selection popup to Odoo's standard image fields.
Users can choose an image from the file explorer or capture a new image with
an available browser camera. The captured image is passed through Odoo's
normal image field upload flow.
""",
    'version': '19.0.1.0.0',
    'category': 'Tools/UI',
    'author': 'SARANG T',
    'license': 'LGPL-3',
    'depends': ['web'],
    'data': [],
    'images': [
        'static/description/camera.png',
    ],
    'assets': {
        'web.assets_backend': [
            'image_camera_upload/static/src/js/image_source_dialog.js',
            'image_camera_upload/static/src/js/image_field.js',
            'image_camera_upload/static/src/xml/image_source_dialog.xml',
            'image_camera_upload/static/src/xml/image_field.xml',
            'image_camera_upload/static/src/scss/image_camera_upload.scss',
        ],
    },
    'installable': True,
    'application': False,
    'auto_install': False,
}
