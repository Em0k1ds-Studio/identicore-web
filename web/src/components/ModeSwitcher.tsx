import { Accessor, Setter } from 'solid-js';

interface ModeSwitcherProps {
  mode: Accessor<boolean>;
  setMode: Setter<boolean>;
}

const ModeSwitcher = (props: ModeSwitcherProps) => {
  return (
    <div class="mx-auto max-w-[430px] w-full h-[38px] ic-bg-200 rounded-lg ic-border-000 flex flex-row text-center items-center relative">
      <div
        class={`ic-hover-400 pt-1 flex-1 z-20 font-tiempos font-normal ${
          !props.mode() ? 'ic-text-300' : 'ic-text-100'
        } text-base tracking-widest select-none cursor-pointer transition-colors duration-250 ease-in-out`}
        onClick={() => props.setMode(false)}
      >
        recognition
      </div>
      <div
        class={`ic-hover-400 pt-1 flex-1 z-20 font-tiempos font-normal ${
          props.mode() ? 'ic-text-300' : 'ic-text-100'
        } text-base tracking-widest select-none cursor-pointer transition-colors duration-250 ease-in-out`}
        onClick={() => props.setMode(true)}
      >
        verification
      </div>
      {/* Indicator */}
      <div
        class="mx-auto ic-bg-100 rounded-lg z-10 absolute bottom-0 left-0 w-1/2 h-[30px] mb-[3px] transform transition-transform duration-250 ease-[cubic-bezier(0.4,0.0,0.2,1)]"
        style={{
          transform: props.mode()
            ? 'translateX(calc(100% - 3px))'
            : 'translateX(3px)',
        }}
      ></div>
    </div>
  );
};

export default ModeSwitcher;
