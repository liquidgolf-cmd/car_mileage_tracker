//
//  ContentView.swift
//  CarMileage
//
//  Created on [Date]
//

import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Track", systemImage: "location.circle.fill")
                }
                .tag(0)
            
            TripListView()
                .tabItem {
                    Label("Trips", systemImage: "list.bullet")
                }
                .tag(1)
            
            ReportsView()
                .tabItem {
                    Label("Reports", systemImage: "doc.text")
                }
                .tag(2)
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(3)
        }
    }
}

#Preview {
    ContentView()
        .environment(\.managedObjectContext, CoreDataService.shared.viewContext)
}

