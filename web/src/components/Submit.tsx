import { Accessor, Setter } from 'solid-js';
import { WS_BASE_URL } from '../api';
import { createReconnectingWS } from '@solid-primitives/websocket';
import {
  IdentificationForm,
  IdentificationResponse,
  VerificationForm,
  VerificationResponse,
  WsMsgType,
} from '../lib/identicoreTypes';
import { encode, decode } from '@msgpack/msgpack';

interface SubmitProps {
  isReady: Accessor<boolean>;
  mode: Accessor<boolean>;
  firstPhoto: Accessor<File | undefined>;
  secondPhoto: Accessor<File | undefined>;
  setResult: Setter<IdentificationResponse | VerificationResponse | undefined>;
  setShowResults: Setter<boolean>;
  setIsQueued: Setter<boolean>;
  IsQueued: Accessor<boolean>;
}

const Submit = (props: SubmitProps) => {
  // const ws = makeHeartbeatWS(createReconnectingWS(`${WS_BASE_URL}/core/ws`), {
  //   message: new Uint8Array([0x10, 0x80]),
  //   interval: 5000,
  //   wait: 10000,
  // });

  const ws = createReconnectingWS(`${WS_BASE_URL}/core/ws`);

  const onMessage = async (msg: MessageEvent) => {
    if (!(msg.data instanceof Blob)) return;

    let outer = new Uint8Array(await msg.data.arrayBuffer());

    const assignInner = (
      inner: IdentificationResponse | VerificationResponse
    ) => {
      props.setResult(inner);
      props.setIsQueued(false);
      props.setShowResults(true);
    };

    switch (outer[0]) {
      case WsMsgType.IDENTIFY_RESPONSE:
        let innerIdentify = decode(outer.slice(1)) as IdentificationResponse;
        assignInner(innerIdentify);
        break;

      case WsMsgType.VERIFICATION_RESPONSE:
        let innerVerification = decode(outer.slice(1)) as VerificationResponse;
        assignInner(innerVerification);
        break;

      default:
        break;
    }
  };

  ws.addEventListener('message', onMessage);

  const SubmitAction = async (): Promise<void> => {
    if (!props.isReady()) return;

    let firstPhoto = props.firstPhoto();
    if (!firstPhoto) return;

    const firstPhotoBlob = new Uint8Array(await firstPhoto.arrayBuffer());

    if (props.mode()) {
      let secondPhoto = props.secondPhoto();
      if (!secondPhoto) return;

      const secondPhotoBlob = new Uint8Array(await secondPhoto.arrayBuffer());

      let inner: VerificationForm = {
        first_image: firstPhotoBlob,
        second_image: secondPhotoBlob,
      };

      var innerBlob = encode(inner);
    } else {
      let inner: IdentificationForm = { image: firstPhotoBlob };
      var innerBlob = encode(inner);
    }

    let payloadBlob = new Uint8Array(innerBlob.length + 1);

    payloadBlob[0] = props.mode()
      ? WsMsgType.VERIFICATION_REQUEST
      : WsMsgType.IDENTIFY_REQUEST;

    payloadBlob.set(innerBlob, 1);

    ws.send(payloadBlob);
    props.setIsQueued(true);
  };

  return (
    <>
      <button
        class={`mx-auto mt-3 mb-10 h-[38px] w-[157px] md:w-[197px] ${
          props.isReady() ? 'opacity-100' : 'opacity-0'
        } ic-bg-text-500 ic-bg-200 ic-text-100 ic-hover-400 ic-border-300 font-styrene font-normal flex flex-row justify-center items-center text-center tracking-wide ic-shadow-000 rounded-lg transform hover:scale-y-[1.02] hover:scale-x-[1.01] backface-hidden transition-all duration-250 ease-in-out select-none
        shrink-0
        can-focus
        overflow-hidden
        font-styrene
        will-change-transform
        after:absolutes
        after:inset-0
        after:bg-[radial-gradient(at_bottom,hsla(0,0%,100%,0.03),hsla(0,0%,100%,0))]
        after:opacity-0
        after:transition
        after:duration-250
        after:translate-y-2
        hover:after:opacity-100
        hover:after:translate-y-0 active:scale-[0.985] whitespace-nowrap
        disabled:pointer-events-none
        disabled:opacity-50
        disabled:shadow-none
        disabled:drop-shadow-none`}
        onClick={SubmitAction}
        disabled={props.IsQueued()}
      >
        Submit
      </button>
    </>
  );
};

export default Submit;
