import { useState } from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { Button, Typography, stepClasses } from "@mui/material";

export default function CustomTextField() {
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [taskId, setTaskId] = useState("");
  const [predictionClass, setPredictionClass] = useState("");

  const handlePredict = async () => {
    try {
      // Формируем URL с параметрами в query строке
      const url = `http://localhost:8004/pred?text=${encodeURIComponent(text)}`;

      // Отправляем POST-запрос на сервер
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);

      const data = await response.json();
      console.log(data);
      setTaskId(data.task_id);

      // Функция для проверки статуса задачи
      const checkTaskStatus = async () => {
        try {
          const taskUrl = `http://localhost:8004/pred/${data.task_id}`;
          const taskResponse = await fetch(taskUrl);

          if (!taskResponse.ok) {
            throw new Error("Network response was not ok");
          }

          const taskData = await taskResponse.json();

          if (taskData.task_status === "SUCCESS") {
            // Если задача завершена успешно, устанавливаем теги и класс предсказания
            setTags(taskData.task_result.wods);
            setPredictionClass(taskData.task_result.class);
          } else {
            // Если задача еще не завершена, ждем 1 секунду и проверяем ее статус снова
            setTimeout(checkTaskStatus, 100);
          }
        } catch (error) {
          console.error(
            "There was a problem with checking task status:",
            error
          );
        }
      };

      // Начинаем проверку статуса задачи
      await checkTaskStatus();
    } catch (error) {
      console.error("There was a problem with your fetch operation:", error);
    }
  };
  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          paddingTop: "50px",
          paddingLeft: "50px",
          paddingRight: "25px",
        }}
      >
        <TextField
          sx={{ width: 700 }}
          id="outlined-textarea"
          label="Текст"
          placeholder="Введите текст"
          multiline
          value={text}
          onChange={handleTextChange}
        />
        <Button
          sx={{ width: "20%", marginTop: "20px" }}
          variant="contained"
          onClick={handlePredict}
        >
          Predict
        </Button>
      </Box>

      {tags && predictionClass && (
        <Box
          sx={{
            maxWidth: "300px",
            width: "100%",
            marginTop: "20px",
            border: "1px solid #ccc",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#f5f5f5",
          }}
        >
          <Typography variant="h6">Tags:</Typography>
          <Typography>{tags}</Typography>
          <Typography variant="h6">Class:</Typography>
          <Typography>{predictionClass}</Typography>
        </Box>
      )}
    </Box>
  );
}
