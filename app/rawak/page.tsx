"use client";

import PageSection from '@/components/ui/pageSection';
import React, { useCallback, useId, useState } from 'react';
import { institutions } from "../data/institutions";
import QrCodeDisplay from '@/components/ui/qrCodeDisplay';
import Image from "next/image";
import useClientDimensions from '@/hooks/use-client-dimensions';
import { categories } from '../types/institutions';

const Rawak = () => {
  const id = useId();
  // const [randomInstitutionId, setRandomInstitutionId] = useState(Math.floor(Math.random() * institutions.length));
  const [randomInstitutionId, setRandomInstitutionId] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { width } = useClientDimensions();


	const mappedCategories = Object.keys(categories).map((category) => ({
		label: categories[category as keyof typeof categories].label,
		value: category,
	}));

  const filteredInstitutions = institutions.filter((institution) => selectedCategories.length !== 0 ? selectedCategories.includes(institution.category) : true);
  const institutionLength = filteredInstitutions.length;

  const generateRandomNumber = useCallback(() => {
    setIsLoaded(false);
    const randomNumber = Math.floor(Math.random() * institutionLength);

    setRandomInstitutionId(randomNumber);
    setIsLoaded(true);
  }, [institutionLength]);

  const randomInstitution = filteredInstitutions[randomInstitutionId];

  return (
    <PageSection className="items-center justify-center">
      <div className="grid place-items-center m-8">
        <div
          className="w-full max-w-[500px] h-full flex flex-col bg-white sm:rounded-3xl"
        >
          <div
            className="flex items-center justify-center "
          >
            {isLoaded && randomInstitution.qrContent ? (
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
                src={randomInstitution.qrImage}
                alt={randomInstitution.name}
                className="w-full h-full lg:h-full sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-top"
              />
            )}
          </div>

          <div>
            <div className="flex justify-between items-start p-4">
              <div>
                <h3
                  className="font-medium text-neutral-700 text-base capitalize"
                >
                  {randomInstitution.name}
                </h3>
                <p
                  className="text-neutral-600 text-base capitalize"
                >
                  {randomInstitution.city}, {randomInstitution.state}
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

			<div className="grid grid-flow-col gap-1 items-center">
				<p className="max-sm:text-xs">Pilih Tapisan: </p>
				{mappedCategories.map((category) => (
					<button
						type="button"
						key={category.value}
						onClick={() => {
							if (selectedCategories.includes(category.value)) {
								setSelectedCategories(
									selectedCategories.filter((c) => c !== category.value),
								);
							} else {
								setSelectedCategories([...selectedCategories, category.value]);
							}
						}}
						data-active={selectedCategories.includes(category.value)}
						className="px-4 py-2 rounded-xl text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center"
					>
						{category.label}
						<span className="rounded-full px-2 py-1 bg-slate-200  text-black ">{institutions.filter(ins => ins.category === category.value).length}</span>
					</button>
				))}
			</div>
    </PageSection>
  )
}

export default Rawak
