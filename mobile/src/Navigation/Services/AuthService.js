import api from "./Connection";



export const login = async (email, password) => {
  try {     
    const response = await api.post("api/v1/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Error en conexión:", error.response?.data || error.message);
    throw error.response?.data || { message: "Error en la conexión" + error};
  }
};



export const register = async (fullName,email,jobTitle,laborDepartament,password,passwordConfirmation) => {
  try {
    const response = await api.post("api/v1/auth/register", { fullName,email,jobTitle,laborDepartament,password,passwordConfirmation });
    return response.data;
  } catch (error) {
    console.error("Error en conexión:", error.response?.data || error.message);
    throw error.response?.data || { message: "Error en la conexión" + error};
  }
};
  