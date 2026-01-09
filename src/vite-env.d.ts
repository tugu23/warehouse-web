/// <reference types="vite/client" />

declare module 'quagga' {
  const Quagga: {
    init: (config: object, callback?: (err: Error | null) => void) => void;
    start: () => void;
    stop: () => void;
    onDetected: (callback: (result: { codeResult: { code: string } }) => void) => void;
    offDetected: (callback?: (result: { codeResult: { code: string } }) => void) => void;
    decodeSingle: (
      config: object,
      callback: (result: { codeResult: { code: string } | null }) => void
    ) => void;
  };
  export default Quagga;
}

declare module 'leaflet/dist/images/marker-icon.png' {
  const value: string;
  export default value;
}

declare module 'leaflet/dist/images/marker-shadow.png' {
  const value: string;
  export default value;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  export const Eye: ComponentType<SVGProps<SVGSVGElement>>;
  export const EyeOff: ComponentType<SVGProps<SVGSVGElement>>;
  export const Mail: ComponentType<SVGProps<SVGSVGElement>>;
  export const Lock: ComponentType<SVGProps<SVGSVGElement>>;
  export const User: ComponentType<SVGProps<SVGSVGElement>>;
  export const Phone: ComponentType<SVGProps<SVGSVGElement>>;
}
