export enum WsMsgType {
  PING_REQUEST = 0x10,
  PONG_RESPONSE = 0x11,

  IDENTIFY_REQUEST = 0xa0,
  IDENTIFY_RESPONSE = 0xa1,

  VERIFICATION_REQUEST = 0xb0,
  VERIFICATION_RESPONSE = 0xb1,

  DIAGNOSTIC_REQUEST = 0xf0,
  DIAGNOSTIC_RESPONSE = 0xf1,

  THROTTLED_RESPONSE = 0xff,
}

export type IdentificationForm = {
  image: Uint8Array;
};

export type VerificationForm = {
  first_image: Uint8Array;
  second_image: Uint8Array;
};

export type StatusModel = {
  ok: boolean;
  detail: string | null;
};

export type FaceRectangle = {
  top_left: [number, number];
  bottom_right: [number, number];
};

export type IdentificationResponse = StatusModel & {
  faces_count: number;
  faces: FaceRectangle[];
};

export type VerificationResponse = StatusModel & {
  is_match: boolean;
  similarity_confidence: number;
  faces: FaceRectangle[];
};

export function isIdentificationResponse(
  response: IdentificationResponse | VerificationResponse | undefined
): response is IdentificationResponse {
  return (
    response !== undefined &&
    'faces_count' in response &&
    typeof response.faces_count === 'number'
  );
}

export function isVerificationResponse(
  response: IdentificationResponse | VerificationResponse | undefined
): response is VerificationResponse {
  return (
    response !== undefined &&
    'is_match' in response &&
    typeof response.is_match === 'boolean'
  );
}

export function isErrorResponse(
  response:
    | IdentificationResponse
    | VerificationResponse
    | StatusModel
    | undefined
): response is StatusModel {
  return (
    response !== undefined &&
    !response.ok &&
    typeof response.detail === 'string'
  );
}
