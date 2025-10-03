import { NavigationContainer } from '@react-navigation/native';
import AuthNavegation from './src/Navigation/AuthNavegation';



export default function App() {

  return (
    <NavigationContainer>
      <AuthNavegation />
    </NavigationContainer>
  );
}