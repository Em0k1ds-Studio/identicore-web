import {
  Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Setter,
  Show,
} from 'solid-js';

import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import { stringify } from 'yaml';
import {
  IdentificationResponse,
  isVerificationResponse,
  VerificationResponse,
} from '../lib/identicoreTypes';
import Hamster from './Hamster';

hljs.registerLanguage('yaml', yaml);

interface ResultsProps {
  body: Accessor<IdentificationResponse | VerificationResponse | undefined>;
  showResults: Accessor<boolean>;
  setShowResults: Setter<boolean>;
  firstPhoto: Accessor<File | undefined>;
  secondPhoto: Accessor<File | undefined>;
  isQueued: Accessor<boolean>;
}

const Results = (props: ResultsProps) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      props.setShowResults(false);
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  const copySnippet = async () => {
    await navigator.clipboard.writeText(stringify(props.body() || {}));
  };

  const [urls, setUrls] = createSignal<{ first: string; second: string }>({
    first: '',
    second: '',
  });

  createEffect(() => {
    const first = props.firstPhoto()
      ? URL.createObjectURL(props.firstPhoto()!)
      : '';

    const second = props.secondPhoto()
      ? URL.createObjectURL(props.secondPhoto()!)
      : '';

    setUrls({ first, second });

    onCleanup(() => {
      if (first) URL.revokeObjectURL(first);
      if (second) URL.revokeObjectURL(second);
    });
  });

  const VerificationOverview = (props: { body: VerificationResponse }) => (
    <>
      Faces are <b>{props.body.is_match ? 'same' : 'different'}</b> with{' '}
      <b>{Math.round(props.body.similarity_confidence * 100)}% confidence</b>
    </>
  );

  const IdentificationOverview = (props: { body: IdentificationResponse }) => (
    <>
      Identified <b>{props.body.faces_count} face(s)</b>
    </>
  );

  const ErrorOverview = (props: { detail: string | null | undefined }) => (
    <>
      An unexpected error occurred: <b>{props.detail}</b>
    </>
  );

  return (
    <>
      <div
        class={`w-full min-h-screen ${
          props.showResults() || props.isQueued()
            ? 'opacity-100 z-100 delay-500'
            : 'opacity-0 -z-100 select-none'
        } absolute flex justify-center items-center text-center backdrop-blur-md transition-all duration-250 ease-[cubic-bezier(0.4,0.0,0.2,1)] after:absolute after:text-transparent after:content-['persist-backdrop']`}
      >
        {/* Hamster Loading Component */}
        <div
          class={`z-10 absolute flex justify-center items-center ${
            props.isQueued() ? 'opacity-100 delay-600' : 'opacity-0'
          } transition-all duration-250 ease-[cubic-bezier(0.4,0.0,0.2,1)] select-none`}
        >
          <Hamster />
        </div>
        {/* Out-of-bounds close click */}
        <div
          class="mx-auto absolute w-full h-full -z-10"
          onClick={() => props.setShowResults(false)}
        />
        {/* Section Container */}
        <div
          class={`mx-auto ${
            props.showResults()
              ? 'opacity-100 z-10 delay-300'
              : 'opacity-0 -z-10 select-none'
          } relative ic-bg-200 m-10 w-[80vw] h-[85vh] md:w-[75vw] md:h-[80vh] flex flex-col md:flex-row justify-center items-center rounded-lg overflow-auto box-border scroll-p-4 transition-all duration-250 ease-[cubic-bezier(0.4,0.0,0.2,1)]`}
        >
          {/* Close */}
          <button
            class="absolute top-0 right-0 p-3 group z-10"
            onClick={() => props.setShowResults(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-100)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon icon-tabler icons-tabler-outline icon-tabler-x group-hover:stroke-[var(--text-400)] transition-all duration-250 ease-in-out "
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          {/* Content Wrapper */}
          <div class="w-full h-full flex flex-col md:flex-row">
            {/* Images Section */}
            <div class="flex-1 md:flex-1/3 w-full h-fit md:h-full p-4 flex flex-row items-center text-center justify-center">
              <div class="flex-1 flex flex-col items-center text-center justify-center gap-2 font-normal font-tiempos ic-text-000 select-none">
                <img
                  src={urls().first}
                  class="min-h-0 min-w-0 max-w-[180px] md:max-w-[270px] w-full h-auto object-cover rounded-lg ic-shadow-200"
                />
                <i>{props.firstPhoto()?.name}</i>
              </div>
              <Show
                when={
                  (props.secondPhoto() &&
                    isVerificationResponse(props.body())) ||
                  !props.body()?.ok
                }
              >
                <div class="flex-1 flex flex-col items-center text-center justify-center gap-2 font-normal font-tiempos ic-text-000 select-none">
                  <img
                    src={urls().second}
                    class="min-h-0 min-w-0 max-w-[180px] md:max-w-[270px] w-full h-auto object-cover rounded-lg ic-shadow-200"
                  />
                  <i>{props.secondPhoto()?.name}</i>
                </div>
              </Show>
            </div>
            {/* Results Section */}
            <div class="flex-1/3 md:flex-1 ic-bg-000 w-full h-full flex flex-col items-start break-words max-md:rounded-b-lg md:rounded-r-lg border-dashed border-[rgba(101,100,95,0.4)] max-md:border-t md:border-l overflow-hidden">
              <div class="w-full h-full p-4 flex flex-col justify-start items-start text-start min-h-0">
                {/* Header */}
                <div class="font-medium font-copernicus text-[26px] ic-text-200">
                  Results
                </div>
                {/* Overview */}
                <div class="font-normal font-styrene text-base ic-text-100">
                  {props.body() &&
                    (props.body()?.ok ? (
                      isVerificationResponse(props.body()) ? (
                        <VerificationOverview
                          body={props.body() as VerificationResponse}
                        />
                      ) : (
                        <IdentificationOverview
                          body={props.body() as IdentificationResponse}
                        />
                      )
                    ) : (
                      <ErrorOverview detail={props.body()?.detail} />
                    ))}
                </div>
                {/* Code block */}
                <main class="w-full flex mt-4 p-4 pr-0 ic-bg-100 ic-border-300 rounded-lg relative group/codeblock min-h-0">
                  <pre class="whitespace-pre-wrap overflow-auto h-full flex flex-row flex-1">
                    <code
                      class="break-inside-avoid font-normal font-sfmono text-sm"
                      innerHTML={
                        hljs.highlight(stringify(props.body() || {}), {
                          language: 'yaml',
                        }).value
                      }
                    />
                  </pre>
                  {/* Copy Snippet */}
                  <div
                    class="absolute top-0 right-0 p-2 group/icon"
                    onClick={copySnippet}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-100)"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="icon icon-tabler icons-tabler-outline icon-tabler-copy opacity-0 group-hover/codeblock:opacity-100 group-hover/icon:stroke-[var(--text-400)] group-hover/icon:scale-y-[1.02] group-hover/icon:scale-x-[1.01] group-active/icon:scale-[0.97] backface-hidden transition-all duration-250 ease-in-out"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" />
                      <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
                    </svg>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Results;
