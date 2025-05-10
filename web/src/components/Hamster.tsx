import './Hamster.css';

const Hamster = () => {
  return (
    <>
      <div
        aria-label="Orange and tan hamster running in a metal wheel"
        role="img"
        class="wheel-and-hamster"
      >
        <div class="wheel" />
        <div class="hamster">
          <div class="hamster__body">
            <div class="hamster__head">
              <div class="hamster__ear" />
              <div class="hamster__eye" />
              <div class="hamster__nose" />
            </div>
            <div class="hamster__limb hamster__limb--fr" />
            <div class="hamster__limb hamster__limb--fl" />
            <div class="hamster__limb hamster__limb--br" />
            <div class="hamster__limb hamster__limb--bl" />
            <div class="hamster__tail" />
          </div>
        </div>
        <div class="spoke" />
      </div>
    </>
  );
};

export default Hamster;
