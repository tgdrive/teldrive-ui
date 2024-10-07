import { memo, startTransition, useMemo } from "react";
import type { SetValue, UploadStats } from "@/types";
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@tw-material/react";
import type { ApexOptions } from "apexcharts";
import ReactApexChart from "react-apexcharts";

const options: ApexOptions = {
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#3C50E0"],
  chart: {
    height: 335,
    type: "area",
    fontFamily: "inherit",
    dropShadow: {
      enabled: true,
      color: "#623CEA14",
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1,
    },

    toolbar: {
      show: false,
    },
  },

  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300,
        },
      },
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350,
        },
      },
    },
  ],
  stroke: {
    width: [2, 2],
    curve: "straight",
  },
  grid: {
    xaxis: {
      lines: {
        show: true,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 4,
    colors: "#fff",
    strokeColors: ["#3056D3"],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    hover: {
      size: undefined,
      sizeOffset: 5,
    },
  },
  series: [
    {
      name: "Uploaded",
      data: [],
    },
  ],
  xaxis: {
    type: "category",
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
  },
  yaxis: {
    title: {
      text: "Size (GB)",
      style: {
        cssClass: "font-bold text-small",
      },
    },
  },
};

function getChartData(stats: UploadStats[]): ApexOptions {
  const categories = stats.map((stat) => stat.uploadDate);
  const data = stats.map((stat) => stat.totalUploaded);
  return {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories,
    },
    series: [
      {
        name: "Uploaded",
        data,
      },
    ],
  };
}

interface UploadStatsChartProps {
  stats: UploadStats[];
  days: number;
  setDays: SetValue<number>;
}

const allowedDays = [7, 15, 30, 60];

export const UploadStatsChart = memo(({ stats, days, setDays }: UploadStatsChartProps) => {
  const chartOptions = useMemo(() => getChartData(stats), [stats]);

  return (
    <div className="col-span-12 rounded-lg bg-surface text-on-surface p-4 lg:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full max-w-45 justify-end">
          <Dropdown className="min-w-32" triggerScaleOnOpen={false}>
            <DropdownTrigger>
              <Button variant="filledTonal">{`${days} Days`}</Button>
            </DropdownTrigger>
            <DropdownMenu
              classNames={{
                base: "rounded-lg shadow-1",
              }}
            >
              {allowedDays.map((day) => (
                <DropdownItem
                  key={day}
                  onPress={() =>
                    startTransition(() => {
                      setDays(day);
                    })
                  }
                >{`${day} Days`}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>
      <ReactApexChart
        options={chartOptions}
        series={chartOptions.series}
        type="area"
        height={350}
      />
    </div>
  );
});
