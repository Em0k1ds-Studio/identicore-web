import { JSX, Setter } from 'solid-js';

interface RootProps {
  setIsDragging?: Setter<boolean>;
  children?: JSX.Element;
}

const Root = (props: RootProps) => {
  const handleDragOver = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    props.setIsDragging!(true);
  };

  const handleDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    props.setIsDragging!(false);
  };

  const stubFileDrop = (event: DragEvent): void => {
    event.preventDefault();
    event.stopPropagation();
    props.setIsDragging!(false);
  };

  return (
    <div
      class="ic-bg-100 ic-text-400 min-h-screen flex flex-col"
      data-theme="identicore"
      data-mode="dark"
      {...(props.setIsDragging
        ? {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: stubFileDrop,
          }
        : {})}
    >
      {props.children}
    </div>
  );
};

export default Root;
