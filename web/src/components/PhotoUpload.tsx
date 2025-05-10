import { JSX, Accessor, Setter, Show } from 'solid-js';
import { fileTypeFromBuffer } from 'file-type';

interface PhotoUploadProps {
  id: string;
  file: Accessor<File | undefined>;
  setFile: Setter<File | undefined>;
  IsDragging: Accessor<boolean>;
  setIsDragging: Setter<boolean>;
  style?: JSX.CSSProperties;
  indicator?: JSX.Element;
  zIndex?: number;
}

const PhotoUpload = (props: PhotoUploadProps) => {
  let fileUploadRef: HTMLInputElement | undefined;

  const processFile = async (file: File): Promise<void> => {
    const buffer = await file.arrayBuffer();
    const type = await fileTypeFromBuffer(buffer);

    if (
      !type ||
      !['image/jpeg', 'image/png', 'image/bmp'].includes(type.mime) ||
      file.size > 10 * 1024 * 1024
    ) {
      alert('Invalid file type or size exceeds 10MB');
      return;
    }

    props.setFile(file);
  };

  const handleFileSelect = (event: Event): void => {
    const target = event.target as HTMLInputElement;

    if (target.files && target.files.length > 0) processFile(target.files[0]);
  };

  const handleFileDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    props.setIsDragging(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0)
      processFile(event.dataTransfer.files[0]);
  };

  const openFileSelector = (): void => {
    if (fileUploadRef) fileUploadRef.click();
  };

  const limitString = (x: string, n: number): string => {
    if (x.length > n) return x.substring(0, n) + '..';
    else return x;
  };

  return (
    <div
      id={props.id}
      class={`mx-auto ic-bg-200 w-[157px] h-[167px] md:w-[197px] md:h-[207px] rounded-lg ic-shadow-000 flex flex-col justify-center items-center text-center gap-1.5 transform transition-all duration-250 ease-[cubic-bezier(0.4,0.0,0.2,1)] ic-hover-rc-100 ${
        props.IsDragging() ? 'ic-shadow-100 ic-border-200' : 'ic-border-100'
      }`}
      style={{
        ...props.style,
        'z-index': props.zIndex,
      }}
      onClick={openFileSelector}
      onDrop={handleFileDrop}
    >
      <input
        class="hidden"
        type="file"
        ref={fileUploadRef}
        onChange={handleFileSelect}
        multiple={false}
        accept=".jpg,.jpeg,.png,.bmp"
      />
      <div>
        <Show
          when={props.file() === undefined || props.IsDragging()}
          fallback={
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="29"
                height="29"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-100)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="icon icon-tabler icons-tabler-outline icon-tabler-face-id"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 8v-2a2 2 0 0 1 2 -2h2" />
                <path d="M4 16v2a2 2 0 0 0 2 2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M16 20h2a2 2 0 0 0 2 -2v-2" />
                <path d="M9 10l.01 0" />
                <path d="M15 10l.01 0" />
                <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
              </svg>
            </>
          }
        >
          <svg
            width="29"
            height="29"
            class="tabler-icon tabler-icon-file-import "
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-100)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="transition: stroke 0.25s ease-in-out;"
          >
            <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
            <path d="M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5m-9.5 -2h7m-3 -3l3 3l-3 3"></path>
          </svg>
        </Show>
      </div>
      <div
        class={`font-styrene font-normal text-sm tracking-wide select-none transition-colors duration-250 ease-in-out ${
          props.IsDragging() ? 'ic-text-100' : 'ic-text-000'
        }`}
      >
        <Show when={!props.IsDragging()} fallback={<>drop the photo here!</>}>
          <Show
            when={props.file() === undefined}
            fallback={<>{limitString(props.file()!.name, 16)}</>}
          >
            drag or select a photo
          </Show>
        </Show>
      </div>
      <div>{props.indicator}</div>
    </div>
  );
};

export default PhotoUpload;
