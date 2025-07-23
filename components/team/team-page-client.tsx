"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeamPageClientProps {
  teamId: string
}

const TeamPageClient: React.FC<TeamPageClientProps> = ({ teamId }) => {
  const [activeTab, setActiveTab] = useState("stats")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid h-auto w-full grid-cols-2 grid-rows-2 gap-3 p-2 md:w-auto md:grid-cols-4 md:grid-rows-1 mb-8">
        <TabsTrigger value="stats" className="h-10">
          Stats
        </TabsTrigger>
        <TabsTrigger value="games" className="h-10">
          Games & Entry
        </TabsTrigger>
        <TabsTrigger value="roster" className="h-10">
          Roster
        </TabsTrigger>
        <TabsTrigger value="settings" className="h-10">
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="stats">
        <div>Stats Content for Team ID: {teamId}</div>
      </TabsContent>
      <TabsContent value="games">
        <div>Games & Entry Content for Team ID: {teamId}</div>
      </TabsContent>
      <TabsContent value="roster">
        <div>Roster Content for Team ID: {teamId}</div>
      </TabsContent>
      <TabsContent value="settings">
        <div>Settings Content for Team ID: {teamId}</div>
      </TabsContent>
    </Tabs>
  )
}

export default TeamPageClient
