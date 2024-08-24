"use client"

import React from 'react';
import Image from 'next/image';

export default function ShareToWhatsapp({ data, imageUrl }: { data: { category: string, id: number, name: string }, imageUrl?: string }) {
    const baseUrl = window.location.origin;

    //   const handleShareClick = async () => {
    //     //TODO: Implement share to whatsapp with QR instead of url

    //     const response = await fetch(imageUrl);
    //     const blob = await response.blob();

    //     const reader = new FileReader();
    //     reader.readAsDataURL(blob);
    //     reader.onload = async () => {
    //       const imageDataURI = reader.result as string;
    //       const message = `Sumbang ke institusi ...! ${imageDataURI}`;
    //       const whatsappLink = `whatsapp://send?text=${encodeURIComponent(message)}`;
    //       window.location.href = whatsappLink;
    //     };
    //   };

    const message = `Sumbang ke ${data.name}!`;
    const shareUrl = `whatsapp://send?text=${encodeURIComponent(`${message}\n${baseUrl}/${data.category}/${data.id}`)}`;

    return (
        <a target="_blank" href={shareUrl} rel="noopener noreferrer">
            <div className='min-w-full mih-h-full'>
                Kongsi ke WhatsApp
            </div>
        </a>
        // <button onClick={handleShareClick}>
        //   Share with WhatsApp
        //   <Image src={imageUrl} alt="Share Image" width={50} height={50} />
        // </button>
    );
};
