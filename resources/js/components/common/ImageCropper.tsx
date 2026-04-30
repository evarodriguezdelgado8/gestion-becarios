import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';

interface Props {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
    
    const onComplete = useCallback((_extended: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const handleSave = async () => {
        // Aquí llamaríamos a una función utilidad para convertir el recorte en un Blob/Archivo
        const blob = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(blob);
    };

    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="max-w-lg">
                <DialogTitle>Recortar foto de perfil</DialogTitle>
                <div className="relative h-80 w-full bg-neutral-200">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} // Proporción 1:1 para perfil
                        onCropChange={onCropChange}
                        onZoomChange={setZoom}
                        onCropComplete={onComplete}
                    />
                </div>
                <div className="py-4">
                    <label className="text-sm">Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button onClick={handleSave}>Aplicar recorte</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Función auxiliar para procesar la imagen (Canvas)
async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    ctx?.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
    });
}