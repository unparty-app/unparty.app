import AboutComponent from '../components/AboutComponent';

const UncolorPage = () => {
  return (
    <main className="mx-auto w-full max-w-5xl">
      {/* Add your page content here */}
      <div className="flex flex-col gap-6">
        <AboutComponent unpppId="uncolor" />
      </div>
    </main>
  );
};

export default UncolorPage;
