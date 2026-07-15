import PageLayout from "@/components/PageLayout";
import "./GraghPage.css"

export default function GraphPage() {
  //const [graphMode, setGraphMode] = useState("月");
  // const changeMode = (mode: string) => {
  //   setGraphMode(mode);
  //   console.log(mode);
  // };
  return (
    <PageLayout title="グラフ">

      <section className="graph-menu">
        <section className="graph-select-area">
          <button className="graph-select-button">
            水温
          </button>
        </section>

        <section className="graph-range-area">
          <button className="graph-range-button">日</button>
          <button className="graph-range-button active">月</button>
          <button className="graph-range-button">年</button>

        </section>
      </section>

      <section className="graph-area">
        {/* グラフがここに */}

      </section>


    </PageLayout>
  );
}