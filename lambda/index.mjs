export async function handler(event, context) {
  console.log("Ruta del evento: ", event.path);

  return {
    statusCode: 200,
    body: `Holaa, mundo desde Lambda! 🖖`,
  };
}
