import { createEffect, createSignal, Show } from 'solid-js';

import ModeSwitcher from '../components/ModeSwitcher';
import Root from '../components/Root';
import PhotoUpload from '../components/PhotoUpload';
import Submit from '../components/Submit';
import Results from '../components/Results';
import {
  IdentificationResponse,
  VerificationResponse,
} from '../lib/identicoreTypes';

function App() {
  const [mode, setMode] = createSignal<boolean>(false);
  const [isDragging, setIsDragging] = createSignal<boolean>(false);
  const [isReady, setIsReady] = createSignal<boolean>(false);
  const [isQueued, setIsQueued] = createSignal<boolean>(false);

  const [firstPhoto, setFirstPhoto] = createSignal<File>();
  const [secondPhoto, setSecondPhoto] = createSignal<File>();

  const [showResults, setShowResults] = createSignal<boolean>(false);
  const [result, setResult] = createSignal<
    IdentificationResponse | VerificationResponse | undefined
  >();

  createEffect(() => {
    switch (mode()) {
      case true:
        setIsReady(firstPhoto() !== undefined && secondPhoto() !== undefined);
        break;

      case false:
        setIsReady(firstPhoto() !== undefined);
        break;
    }
  });

  return (
    <>
      {/* Root Component */}
      <Root setIsDragging={setIsDragging}>
        {/* Results Component */}
        <Results
          body={result}
          showResults={showResults}
          setShowResults={setShowResults}
          firstPhoto={firstPhoto}
          secondPhoto={secondPhoto}
          isQueued={isQueued}
        />
        {/* Screen */}
        <div class="min-h-full w-full overflow-x-hidden min-w-0">
          {/* Main */}
          <main class="mx-auto mt-4 w-full max-w-[90vw] flex-1 flex flex-col gap-2 pt-[10vh] md:pt-[20vh]">
            {/* Header */}
            <div class="mx-auto w-full font-copernicus font-medium ic-text-200 text-[32px] text-center transition-opacity duration-300 ease-in select-none">
              Face
            </div>
            {/* Body */}
            <div class="mx-auto w-full z-10 flex flex-col items-center gap-6">
              {/* Mode Switcher Component */}
              <ModeSwitcher mode={mode} setMode={setMode} />
              {/* Overview */}
              <div class="mx-auto font-copernicus font-medium ic-text-000 text-base tracking-wide select-none">
                <i style={{ 'word-spacing': '1px' }}>
                  <Show
                    when={!mode()}
                    fallback={<>Compare two faces for similarity.</>}
                  >
                    Identify faces in an image.
                  </Show>
                </i>
              </div>
              {/* Upload Section */}
              <div class="mx-auto mt-3 flex flex-row items-center text-center max-w-full">
                {/* First Upload Component */}
                <PhotoUpload
                  id="first-upload"
                  file={firstPhoto}
                  setFile={setFirstPhoto}
                  IsDragging={isDragging}
                  setIsDragging={setIsDragging}
                  style={{
                    transform: mode() ? 'translateX(-60%)' : 'translateX(0px)',
                  }}
                  indicator={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="var(--text-100)"
                      class="bi bi-1-circle-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M9.283 4.002H7.971L6.072 5.385v1.271l1.834-1.318h.065V12h1.312z" />
                    </svg>
                  }
                  zIndex={20}
                />
                {/* Second Upload Component */}
                <PhotoUpload
                  id="second-upload"
                  file={secondPhoto}
                  setFile={setSecondPhoto}
                  IsDragging={isDragging}
                  setIsDragging={setIsDragging}
                  style={{
                    position: 'absolute',
                    ...(mode()
                      ? { transform: 'translateX(60%)', opacity: '1' }
                      : { transform: 'translateX(0px)', opacity: '0' }),
                  }}
                  indicator={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      fill="var(--text-100)"
                      class="bi bi-2-circle-fill"
                      viewBox="0 0 16 16"
                    >
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.646 6.24c0-.691.493-1.306 1.336-1.306.756 0 1.313.492 1.313 1.236 0 .697-.469 1.23-.902 1.705l-2.971 3.293V12h5.344v-1.107H7.268v-.077l1.974-2.22.096-.107c.688-.763 1.287-1.428 1.287-2.43 0-1.266-1.031-2.215-2.613-2.215-1.758 0-2.637 1.19-2.637 2.402v.065h1.271v-.07Z" />
                    </svg>
                  }
                  zIndex={10}
                />
              </div>
              {/* Submit Component */}
              <Submit
                isReady={isReady}
                mode={mode}
                firstPhoto={firstPhoto}
                secondPhoto={secondPhoto}
                setResult={setResult}
                setShowResults={setShowResults}
                setIsQueued={setIsQueued}
                IsQueued={isQueued}
              />
            </div>
          </main>
        </div>
      </Root>
    </>
  );
}

export default App;
