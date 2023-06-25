import "./App.css";
import ReactEcharts from "echarts-for-react";
import * as echarts from "echarts";
import { useEffect, useState } from "react";

const types = [
  { name: "Main", color: "#B798F5" },
  { name: "Solar", color: "#02E10C" },
  { name: "DG", color: "#403F3D" },
  { name: "Battery", color: "#FDE602" },
  { name: "Solar+Battery", color: "#86B0FF" },
  { name: "Battery+Solar", color: "#86B0FF" },
  { name: "Main+Solar", color: "#7243D0" },
  { name: "Main+Battery", color: "#32864B" },
  { name: "Main+Solar+Battery", color: "#8BC486" },
  { name: "DG+Battery", color: "magenta" },
  { name: "DG+Solar+Battery", color: "cyan" },
  { name: "DG+Battery+Solar", color: "cyan" },
  { name: "Undetermined", color: "#BBE3FD" },
  { name: "", color: "white" },
];

function App() {
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [dataCount, setDataCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [categories, setCategories] = useState([]);
  const [option, setOption] = useState({});

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://api.thunder.softoo.co/vis/api/dashboard/ssu/fixed"
      );
      const responseJson = await response.json();
      const limitedData = responseJson.data;
      setData(limitedData);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      setDataCount(data.length);
      const currentDate = new Date();

      const startOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        0,
        0,
        0,
        0
      );

      const endOfDay = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        currentDate.getDate(),
        23,
        59,
        59,
        999
      );
      setStartTime(startOfDay.getTime());
      setEndTime(endOfDay.getTime());
      const uniqueDates = [...new Set(data.map((obj) => obj.date))];
      console.log("uniq", uniqueDates);
      setCategories(uniqueDates);
    }
  }, [data]);

  const renderItem = (params, api) => {
    var categoryIndex = api.value(0);
    var start = api.coord([api.value(1), categoryIndex]);
    var end = api.coord([api.value(2), categoryIndex]);
    var height = api.size([0, 1])[1] * 0.6;
    var rectShape = echarts.graphic.clipRectByRect(
      {
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height,
      },
      {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height,
      }
    );
    return (
      rectShape && {
        type: "rect",
        transition: ["shape"],
        shape: rectShape,
        style: api.style(),
      }
    );
  };

  const updateChartOption = () => {
    const tempOption = {
      tooltip: {
        formatter: function (params) {
          console.log("params", params);
          return (
            params.marker +
            params.name +
            ": " +
            params.value[3] / 60000 +
            " mins"
          );
        },
      },
      title: {
        text: "Profile",
        left: "center",
      },
      dataZoom: [
        {
          type: "slider",
          filterMode: "weakFilter",
          showDataShadow: false,
          top: 400,
          labelFormatter: "",
        },
        {
          type: "inside",
          filterMode: "weakFilter",
        },
      ],
      grid: {
        height: 300,
      },
      xAxis: {
        type: "time",
        min: startTime,
        max: endTime,
        scale: true,
        axisLabel: {
          formatter: function (val) {
            return new Date(val).toLocaleTimeString();
          },
        },
        interval: 300000,
      },
      yAxis: {
        data: categories,
      },
      series: [
        {
          type: "custom",
          renderItem: renderItem,
          itemStyle: {
            opacity: 0.8,
          },
          encode: {
            x: [1, 2],
            y: 0,
          },
          data: chartData,
        },
      ],
    };
    setOption(tempOption);
  };

  useEffect(() => {
    if (categories.length > 0) {
      const tempChartData = [];
      let baseTime = {};
      for (let i = 0; i < dataCount; i++) {
        if (!baseTime[data[i].date]) {
          baseTime[data[i].date] = { startTime, sourceTag: data[i].sourceTag };
        }
        console.log("basetime", baseTime);
        if (baseTime[data[i].date].sourceTag !== data[i].sourceTag) {
          let sourceTag = baseTime[data[i].date].sourceTag;
          baseTime[data[i].date].sourceTag = data[i].sourceTag;
          const typeItem = types.find((item) => item.name === sourceTag);
          const currentDate = new Date();

          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getDate()).padStart(2, "0");

          const formattedDate = `${year}-${month}-${day}`;
          const dateTime = new Date(
            `${formattedDate} ${data[i].minute_window.split(" ")[1]}`
          ).getTime();
          let duration = dateTime - baseTime[data[i].date].startTime;
          let index = categories.findIndex((category) => {
            return category === data[i].date;
          });
          tempChartData.push({
            name: typeItem.name,
            value: [
              index,
              baseTime[data[i].date].startTime,
              (baseTime[data[i].date].startTime += duration),
              duration,
            ],
            itemStyle: {
              normal: {
                color: typeItem.color,
              },
            },
          });
        }
      }
      setChartData(tempChartData);
      updateChartOption();
    }
  }, [categories]);

  return <ReactEcharts option={option} style={{ height: "600px" }} />;
}

export default App;
