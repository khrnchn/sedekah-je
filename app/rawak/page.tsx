"use client";

import PageSection from '@/components/ui/pageSection';
import React, { useId, useState } from 'react';
import { institutions } from "../data/institutions";
import QrCodeDisplay from '@/components/ui/qrCodeDisplay';
import Image from "next/image";
import useClientDimensions from '@/hooks/use-client-dimensions';

const Rawak = () => {
  const id = useId();
  const [randomInstitutionId, setRandomInstitutionId] = useState(0);
  const { width } = useClientDimensions();

  const institutionLength = institutions.length;
  
  const generateRandomNumber = () => {
    const randomNumber = Math.floor(Math.random() * institutionLength);

    setRandomInstitutionId(randomNumber);
  };

  const randomInstitution = institutions[randomInstitutionId];

  return (
    <PageSection>
      <div className="grid place-items-center m-8">
        <div
          className="w-full max-w-[500px] h-full flex flex-col bg-white dark:bg-slate-800 sm:rounded-3xl"
        >
          <div
            className="flex items-center justify-center "
          >
            {randomInstitution.qrContent ? (
              <QrCodeDisplay
                qrContent={randomInstitution.qrContent}
                supportedPayment={randomInstitution.supportedPayment}
                size={width < 500 ? (width - 80) : 500}
              />
            ) : (
              <Image
                priority
                width={200}
                height={200}
                src={randomInstitution.image}
                alt={randomInstitution.name}
                className="w-full h-full lg:h-full sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
              />
            )}
          </div>

          <div>
            <div className="flex justify-between items-start p-4">
              <div>
                <h3
                  className="font-medium text-neutral-700 dark:text-neutral-200 text-base capitalize"
                >
                  {randomInstitution.name}
                </h3>
                <p
                  className="text-neutral-600 dark:text-neutral-400 text-base capitalize"
                >
                  {randomInstitution.location}
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(randomInstitution.name)}`}
                target="_blank"
                className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white"
                rel="noreferrer"
              >
                Cari di peta
              </a>
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={generateRandomNumber} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors duration-300 sticky bottom-12">
        🎲 Generate Random Institution
      </button>
    </PageSection>
  )
}

export default Rawak