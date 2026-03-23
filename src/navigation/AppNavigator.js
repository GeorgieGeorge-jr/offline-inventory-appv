import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelector } from "react-redux";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AddProductScreen from "../screens/AddProductScreen";
import StockMovementScreen from "../screens/StockMovementScreen";
import InventoryListScreen from "../screens/InventoryListScreen";
import ReportsScreen from "../screens/ReportsScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import StaffSalesScreen from "../screens/StaffSalesScreen";
import UsersListScreen from "../screens/UsersListScreen";
import UserDetailsScreen from "../screens/UserDetailsScreen";
import AddUserScreen from "../screens/AddUserScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = "circle";

          if (route.name === "Dashboard") {
            iconName = "view-dashboard";
          } else if (route.name === "Inventory") {
            iconName = "package-variant-closed";
          } else if (route.name === "Reports") {
            iconName = "chart-bar";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6200ee",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Inventory" component={InventoryListScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : user?.role === "staff" ? (
          <Stack.Screen
            name="StaffSales"
            component={StaffSalesScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ title: "Add Product" }}
            />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ title: "Product Details" }}
            />
            <Stack.Screen
              name="StockIn"
              component={StockMovementScreen}
              initialParams={{ type: "IN" }}
              options={{ title: "Stock In" }}
            />
            <Stack.Screen
              name="StockOut"
              component={StockMovementScreen}
              initialParams={{ type: "OUT" }}
              options={{ title: "Stock Out" }}
            />
            <Stack.Screen
              name="UsersList"
              component={UsersListScreen}
              options={{ title: "Users" }}
            />
            <Stack.Screen
              name="UserDetails"
              component={UserDetailsScreen}
              options={{ title: "User Details" }}
            />
            <Stack.Screen
              name="AddUser"
              component={AddUserScreen}
              options={{ title: "Add Staff User" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}