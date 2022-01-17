import {
  getFocusedRouteNameFromRoute,
  NavigationContainer,
} from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import "expo-asset";
import _ from "lodash";
import React from "react";
import { Image, LogBox } from "react-native";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import thunk from "redux-thunk";
import LoginScreen from "./components/auth/Login";
import RegisterScreen from "./components/auth/Register";
import MainScreen from "./components/Main";
import SaveScreen from "./components/main/add/Save";
import ChatScreen from "./components/main/chat/Chat";
import ChatListScreen from "./components/main/chat/List";
import CommentScreen from "./components/main/post/Comment";
import PostScreen from "./components/main/post/Post";
import EditScreen from "./components/main/profile/Edit";
import ProfileScreen from "./components/main/profile/Profile";
import BlockedScreen from "./components/main/random/Blocked";
import { container } from "./components/styles";
import rootReducer from "./redux/reducers";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseConfig } from "./firebaseConfig";
import { useState, useEffect } from "react";

const store = createStore(rootReducer, applyMiddleware(thunk));
LogBox.ignoreLogs(["Setting a timer"]);
const _console = _.clone(console);
console.warn = (message) => {
  if (message.indexOf("Setting a timer") <= -1) {
    _console.warn(message);
  }
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const logo = require("./assets/logo.png");
const Stack = createStackNavigator();

export default function App(props) {
  const [loaded, setloaded] = useState(false);
  const [loggedIn, setloggedIn] = useState(false);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        setloaded(true);
        setloggedIn(false);
      } else {
        setloaded(true);
        setloggedIn(true);
      }
    });
  }, []);
  if (!loaded) {
    return <Image style={container.splash} source={logo} />;
  }

  if (!loggedIn) {
    return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            navigation={props.navigation}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            navigation={props.navigation}
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Main">
          <Stack.Screen
            key={Date.now()}
            name="Main"
            component={MainScreen}
            navigation={props.navigation}
            options={({ route }) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? "Feed";

              switch (routeName) {
                case "Camera": {
                  return {
                    headerTitle: "Camera",
                  };
                }
                case "chat": {
                  return {
                    headerTitle: "Chat",
                  };
                }
                case "Profile": {
                  return {
                    headerTitle: "Profile",
                  };
                }
                case "Search": {
                  return {
                    headerTitle: "Search",
                  };
                }
                case "Feed":
                default: {
                  return {
                    headerTitle: "Instagram",
                  };
                }
              }
            }}
          />
          <Stack.Screen
            key={Date.now()}
            name="Save"
            component={SaveScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="video"
            component={SaveScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Post"
            component={PostScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Chat"
            component={ChatScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="ChatList"
            component={ChatListScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Edit"
            component={EditScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Profile"
            component={ProfileScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Comment"
            component={CommentScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="ProfileOther"
            component={ProfileScreen}
            navigation={props.navigation}
          />
          <Stack.Screen
            key={Date.now()}
            name="Blocked"
            component={BlockedScreen}
            navigation={props.navigation}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
