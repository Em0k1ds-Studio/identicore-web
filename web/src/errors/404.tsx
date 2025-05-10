import Root from '../components/Root';

function NotFound() {
  return (
    <>
      <Root>
        {/* Screen */}
        <div class="min-h-full w-full overflow-x-hidden min-w-0">
          {/* Main */}
          <main class="mx-auto mt-4 w-full max-w-[90vw] flex-1 flex flex-col gap-2 pt-[10vh] md:pt-[20vh]">
            <h1 class="mx-auto w-full font-copernicus font-medium ic-text-200 text-[32px] text-center transition-opacity duration-300 ease-in">
              Page not found
            </h1>
            {/* Overview */}
            <h2 class="mx-auto font-copernicus font-medium ic-text-000 text-center text-base tracking-wide max-w-[90vw]">
              <i style={{ 'word-spacing': '1px' }}>
                The page you are looking for does not exist or may have been
                moved.
                <br />
                Keep exploring our site.
              </i>
            </h2>
          </main>
        </div>
      </Root>
    </>
  );
}

export default NotFound;
