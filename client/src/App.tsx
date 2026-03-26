import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// ضيف دول حسب ملفاتك
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Payment from "./pages/Payment";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/payment" component={Payment} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}
