import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMosquesCount, getOthersCount, getSurauCount } from "../_lib/actions";

const Stats = () => {
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Mosque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">
              {getMosquesCount()}
            </p>
            <p className="text-sm text-muted-foreground">
              Places of worship registered as mosques
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Surau</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">
              {" "}
              {getSurauCount()}
            </p>
            <p className="text-sm text-muted-foreground">
              Places of worship registered as surau
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Others</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-4xl font-semibold">
              {" "}
              {getOthersCount()}
            </p>
            <p className="text-sm text-muted-foreground">
              Places of worship registered as others
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Stats;
