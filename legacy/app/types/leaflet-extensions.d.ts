import "leaflet";

declare module "leaflet" {
	namespace Control {
		interface LocateOptions extends L.ControlOptions {
			strings?: {
				title: string;
			};
			locateOptions?: L.LocateOptions;
		}

		class Locate extends L.Control {
			constructor(options?: LocateOptions);
		}

		interface FullscreenOptions extends L.ControlOptions {
			title?: string;
			titleCancel?: string;
			forceSeparateButton?: boolean;
			forcePseudoFullscreen?: boolean;
			fullscreenElement?: HTMLElement;
		}

		class Fullscreen extends L.Control {
			constructor(options?: FullscreenOptions);
		}
	}

	namespace control {
		function locate(options?: Control.LocateOptions): Control.Locate;
		function fullscreen(
			options?: Control.FullscreenOptions,
		): Control.Fullscreen;
	}
}
