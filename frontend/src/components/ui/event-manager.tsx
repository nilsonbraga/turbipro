"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Grid3X3, List, Search, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ClipboardList, Briefcase, Slash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
  isAllDay?: boolean
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
  clientOptions?: string[]
  onEventClickOverride?: (event: Event) => boolean | void
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

const timeOptions = Array.from({ length: 48 }).map((_, idx) => {
  const hours = Math.floor(idx / 2)
    .toString()
    .padStart(2, "0")
  const minutes = idx % 2 === 0 ? "00" : "30"
  return `${hours}:${minutes}`
})

const formatRange = (start: Date, end: Date) =>
  `${start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })}`

const formatDateInput = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateLabel = (date: Date) => date.toLocaleDateString("pt-BR")

const getLocalDateValue = (date?: Date | null) => (date ? formatDateInput(date) : "")
const getLocalTimeValue = (date?: Date | null) => {
  if (!date) return ""
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${hours}:${minutes}`
}

const parseDateInput = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

const combineDateTime = (date?: string, time?: string) => {
  if (!date) return null
  const [year, month, day] = date.split("-").map(Number)
  if (!year || !month || !day) return null
  const [hours, minutes] = (time || "00:00").split(":").map(Number)
  return new Date(year, month - 1, day, hours || 0, minutes || 0)
}

const isAllDayEvent = (event: Event) => Boolean(event.isAllDay)

const DatePickerField = ({
  value,
  onChange,
  placeholder,
}: {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}) => {
  const [open, setOpen] = useState(false)
  const dateObj = parseDateInput(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-left font-normal h-9", !value && "text-muted-foreground")}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateObj ? formatDateLabel(dateObj) : placeholder || "Selecionar"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateObj}
          onSelect={(day) => {
            onChange(day ? formatDateInput(day) : "")
            setOpen(false)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
  clientOptions = [],
  onEventClickOverride,
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [showTasks, setShowTasks] = useState(true)
  const [showLeads, setShowLeads] = useState(true)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [clientFilter, setClientFilter] = useState("")
  const [clientSearch, setClientSearch] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [dayModalEvents, setDayModalEvents] = useState<Event[] | null>(null)
  const [dayDrawerOpen, setDayDrawerOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const capitalizeDate = (value: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "")

  // Keep internal state in sync when parent updates events
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  const normalizeTag = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const hasCalendarTag = (event.tags || []).some((tag) => normalizeTag(tag) === "calendario")
      const isTask = (event.category || "").toLowerCase() === "tarefa" && !hasCalendarTag
      const isLeadEvent = !isTask && !hasCalendarTag
      if (!showTasks && isTask) return false
      if (!showLeads && isLeadEvent) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))

        if (!matchesSearch) return false
      }

      // Client filter (tag match)
      if (clientFilter) {
        const hasClient = event.tags?.some((t) => t?.toLowerCase().includes(clientFilter.toLowerCase()))
        if (!hasClient) return false
      }

      // Category filter
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) {
        return false
      }

      return true
    })
  }, [events, searchQuery, selectedCategories, clientFilter, showTasks, showLeads])

  const hasActiveFilters = selectedCategories.length > 0 || Boolean(clientFilter)

  const clearFilters = () => {
    setSelectedCategories([])
    setClientFilter("")
    setClientSearch("")
    setSearchQuery("")
  }
  const filteredClientOptions = useMemo(() => {
    const base = [...clientOptions].sort((a, b) => a.localeCompare(b))
    if (!clientSearch) return base
    const query = clientSearch.toLowerCase()
    return base.filter((c) => c.toLowerCase().includes(query))
  }, [clientOptions, clientSearch])

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime) return
    const fallbackEnd = new Date(newEvent.startTime.getTime() + 60 * 60 * 1000)
    const endTime = newEvent.endTime || fallbackEnd

    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    }

    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: "",
      description: "",
      color: colors[0].value,
      category: categories[0],
      tags: [],
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent || !selectedEvent.startTime) return
    const fallbackEnd = new Date(selectedEvent.startTime.getTime() + 60 * 60 * 1000)
    const normalizedEvent = {
      ...selectedEvent,
      endTime: selectedEvent.endTime || fallbackEnd,
    }

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? normalizedEvent : e)))
    onEventUpdate?.(selectedEvent.id, normalizedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      onEventDelete?.(id)
      setIsDialogOpen(false)
      setSelectedEvent(null)
    },
    [onEventDelete],
  )

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return

      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
      const newStartTime = new Date(date)
      if (hour !== undefined) {
        newStartTime.setHours(hour, 0, 0, 0)
      }
      const newEndTime = new Date(newStartTime.getTime() + duration)

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      }

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
      onEventUpdate?.(draggedEvent.id, updatedEvent)
      setDraggedEvent(null)
    },
    [draggedEvent, onEventUpdate],
  )

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === "month") {
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
        } else if (view === "week") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
        } else if (view === "day") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
        }
        return newDate
      })
    },
    [view],
  )

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const color = colors.find((c) => c.value === colorValue)
      return color || colors[0]
    },
    [colors],
  )

  const toggleTag = (tag: string, isCreating: boolean) => {
    if (isCreating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
            }
          : null,
      )
    }
  }

  const addTag = (rawValue: string, isCreating: boolean) => {
    const value = rawValue.trim()
    if (!value) return
    if (isCreating) {
      setNewEvent((prev) => {
        const tags = prev.tags || []
        if (tags.includes(value)) return prev
        return { ...prev, tags: [...tags, value] }
      })
    } else {
      setSelectedEvent((prev) => {
        if (!prev) return prev
        const tags = prev.tags || []
        if (tags.includes(value)) return prev
        return { ...prev, tags: [...tags, value] }
      })
    }
    setTagInput("")
  }

  const removeTag = (value: string, isCreating: boolean) => {
    if (isCreating) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.filter((tag) => tag !== value) || [],
      }))
    } else {
      setSelectedEvent((prev) =>
        prev ? { ...prev, tags: prev.tags?.filter((tag) => tag !== value) || [] } : null,
      )
    }
  }

  const handleEventSelection = useCallback(
    (event: Event) => {
      const intercepted = onEventClickOverride?.(event)
      if (intercepted) return
      setSelectedEvent(event)
      setIsDialogOpen(true)
    },
    [onEventClickOverride],
  )

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDay(day)
    setDayDrawerOpen(true)
  }, [])

  const activeStartTime = isCreating ? newEvent.startTime : selectedEvent?.startTime
  const activeEndTime = isCreating ? newEvent.endTime : selectedEvent?.endTime
  const startDateValue = getLocalDateValue(activeStartTime || null)
  const startTimeValue = getLocalTimeValue(activeStartTime || null)
  const endDateValue = getLocalDateValue(activeEndTime || null)
  const endTimeValue = getLocalTimeValue(activeEndTime || null)
  const activeTags = (isCreating ? newEvent.tags : selectedEvent?.tags) || []

  return (
    <div
      className={cn("flex flex-col gap-4", className)}
      style={{
        fontFamily:
          "Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === "month" &&
              capitalizeDate(
                currentDate.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                }),
              )}
            {view === "week" &&
              `Semana de ${capitalizeDate(
                currentDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                }),
              )}`}
            {view === "day" &&
              capitalizeDate(
                currentDate.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
              )}
            {view === "list" && "Todos os eventos"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Visão mensal
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Visão semanal
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Visão diária
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Lista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="h-8"
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="ml-1">Mês</span>
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="ml-1">Semana</span>
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className="h-8"
            >
              <Clock className="h-4 w-4" />
              <span className="ml-1">Dia</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="ml-1">Lista</span>
            </Button>
          </div>

          <Button
            onClick={() => {
              setIsCreating(true)
              setIsDialogOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo evento
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:flex-nowrap">
        <div className="relative w-full sm:flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showTasks ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-2"
                  onClick={() => setShowTasks((v) => !v)}
                >
                  {showTasks ? (
                    <ClipboardList className="h-4 w-4 text-foreground" />
                  ) : (
                    <span className="relative inline-flex items-center justify-center">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <Slash className="h-4 w-4 absolute inset-0 rotate-45 text-muted-foreground" />
                    </span>
                  )}
                  <span className="text-sm">Tarefas</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showTasks ? "Ocultar tarefas" : "Exibir tarefas"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showLeads ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-2"
                  onClick={() => setShowLeads((v) => !v)}
                >
                  {showLeads ? (
                    <Briefcase className="h-4 w-4 text-foreground" />
                  ) : (
                    <span className="relative inline-flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <Slash className="h-4 w-4 absolute inset-0 rotate-45 text-muted-foreground" />
                    </span>
                  )}
                  <span className="text-sm">Leads</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showLeads ? "Ocultar leads" : "Exibir leads"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Client Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Cliente
              {clientFilter && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  1
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <div className="px-2 pb-2">
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={clientFilter || "all"}
              onValueChange={(value) => {
                setClientFilter(value === "all" ? "" : value)
              }}
            >
              <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
              {filteredClientOptions.length === 0 ? (
                <DropdownMenuRadioItem value="__none" disabled>
                  Nenhum cliente encontrado
                </DropdownMenuRadioItem>
              ) : (
                filteredClientOptions.map((client) => (
                  <DropdownMenuRadioItem key={client} value={client}>
                    {client}
                  </DropdownMenuRadioItem>
                ))
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Service Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Serviço
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {selectedCategories.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filtrar por serviço</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {categories.map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={(checked) => {
                  setSelectedCategories((prev) =>
                    checked ? [...prev, category] : prev.filter((c) => c !== category),
                  )
                }}
              >
                {category}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {clientFilter && (
            <Badge variant="secondary" className="gap-1">
              Cliente: {clientFilter}
              <button onClick={() => setClientFilter("")} className="ml-1 hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== category))}
                className="ml-1 hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Calendar Views - Pass filteredEvents instead of events */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          dayModalEvents={dayModalEvents}
          setDayModalEvents={setDayModalEvents}
          onDayClick={handleDayClick}
          onEventClick={(event) => {
            handleEventSelection(event)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          setDayModalEvents={setDayModalEvents}
          onEventClick={(event) => {
            handleEventSelection(event)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            handleEventSelection(event)
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={(event) => {
            handleEventSelection(event)
          }}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Novo evento" : "Detalhes do evento"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Adicione um evento ao seu calendário" : "Visualize e edite os detalhes do evento"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={(isCreating ? newEvent.title : selectedEvent?.title) ?? ""}
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                    : setSelectedEvent((prev) => (prev ? { ...prev, title: e.target.value } : null))
                }
                placeholder="Título do evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={(isCreating ? newEvent.description : selectedEvent?.description) ?? ""}
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    : setSelectedEvent((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                placeholder="Descrição do evento"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data início</Label>
                <DatePickerField
                  value={startDateValue}
                  placeholder="Selecionar data"
                  onChange={(date) => {
                    if (!date) return
                    const next = combineDateTime(date, startTimeValue || "09:00")
                    if (!next) return
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, startTime: next }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, startTime: next } : null))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Hora início</Label>
                <Select
                  value={startTimeValue || undefined}
                  onValueChange={(time) => {
                    const date = startDateValue || formatDateInput(new Date())
                    const next = combineDateTime(date, time)
                    if (!next) return
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, startTime: next }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, startTime: next } : null))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data fim</Label>
                <DatePickerField
                  value={endDateValue}
                  placeholder="Selecionar data"
                  onChange={(date) => {
                    if (!date) return
                    const next = combineDateTime(date, endTimeValue || "18:00")
                    if (!next) return
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, endTime: next }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, endTime: next } : null))
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Hora fim</Label>
                <Select
                  value={endTimeValue || undefined}
                  onValueChange={(time) => {
                    const date = endDateValue || formatDateInput(new Date())
                    const next = combineDateTime(date, time)
                    if (!next) return
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, endTime: next }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, endTime: next } : null))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={(isCreating ? newEvent.category : selectedEvent?.category) ?? ""}
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, category: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, category: value } : null))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <Select
                  value={(isCreating ? newEvent.color : selectedEvent?.color) ?? ""}
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, color: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, color: value } : null))
                  }
                >
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-4 w-4 rounded", color.bg)} />
                          {color.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {activeTags.length > 0 ? (
                    activeTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-0.5 hover:bg-muted/40"
                          onClick={() => removeTag(tag, isCreating)}
                          aria-label={`Remover tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Nenhuma tag selecionada</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicionar tag"
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag(tagInput, isCreating)
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => addTag(tagInput, isCreating)}>
                    Adicionar
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Digite uma tag e pressione Enter ou clique em Adicionar.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            {!isCreating && (
              <Button variant="destructive" onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}>
                Excluir
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setIsCreating(false)
                setSelectedEvent(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={isCreating ? handleCreateEvent : handleUpdateEvent}>
              {isCreating ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={dayDrawerOpen}
        onOpenChange={(open) => {
          setDayDrawerOpen(open)
          if (!open) {
            setSelectedDay(null)
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl lg:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {selectedDay
                ? capitalizeDate(
                    selectedDay.toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }),
                  )
                : "Visão do dia"}
            </SheetTitle>
            <SheetDescription>Eventos do dia selecionado.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {selectedDay ? (
              <DayView
                currentDate={selectedDay}
                events={filteredEvents}
                onEventClick={(event) => {
                  handleEventSelection(event)
                }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                getColorClasses={getColorClasses}
              />
            ) : (
              <div className="text-sm text-muted-foreground">Selecione um dia no calendário.</div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// EventCard component with hover effect
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
  popoverAlign = "left",
}: {
  event: Event
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  getColorClasses: (color: string) => { bg: string; text: string }
  variant?: "default" | "compact" | "detailed"
  popoverAlign?: "left" | "right"
}) {
  const [isHovered, setIsHovered] = useState(false)
  const colorClasses = getColorClasses(event.color)
  const isAllDay = isAllDayEvent(event)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (variant === "compact") {
    return (
      <div
        data-event-card
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-300",
            colorClasses.bg,
            "text-white truncate animate-in fade-in slide-in-from-top-1",
            isHovered && "scale-105 shadow-lg z-10",
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div
            className={cn(
              "absolute top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200",
              popoverAlign === "right" ? "right-0 left-auto" : "left-0",
            )}
          >
            <Card className="border-2 p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                  <div className={cn("h-3 w-3 rounded-full flex-shrink-0", colorClasses.bg)} />
                </div>
                {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {isAllDay ? (
                    <span>Dia inteiro</span>
                  ) : (
                    <>
                      <span>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                      <span className="text-[10px]">({getDuration()})</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div
        data-event-card
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-2",
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-white/50",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && <div className="mt-1 text-sm opacity-90 line-clamp-2">{event.description}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {isAllDay ? "Dia inteiro" : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`}
        </div>
        {isHovered && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-event-card
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-1",
          isHovered && "scale-105 shadow-lg z-10",
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colorClasses.bg)} />
              </div>
              {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {isAllDay ? (
                    <span>Dia inteiro</span>
                  ) : (
                    <>
                      <span>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </span>
                      <span className="text-[10px]">({getDuration()})</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  dayModalEvents,
  setDayModalEvents,
  onDayClick,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  dayModalEvents: Event[] | null
  setDayModalEvents: (events: Event[] | null) => void
  onDayClick: (day: Date) => void
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  const dayDiff = (a: Date, b: Date) =>
    Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000))

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days: Date[] = []
  const cursor = new Date(startDate)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  const singleDayEvents = events.filter((event) => isSameDay(event.startTime, event.endTime))
  const multidayEvents = events.filter((event) => !isSameDay(event.startTime, event.endTime))

  const weeks: Date[][] = []
  for (let i = 0; i < 6; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7))
  }

  const eventsForDay = (day: Date) =>
    singleDayEvents.filter((event) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      return start <= dayEnd && end >= dayStart
    })

  return (
    <Card className="overflow-visible shadow-none">
      <div className="grid grid-cols-7 border-b">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-[1px]">
        {weeks.map((week, weekIndex) => {
          const weekStart = startOfDay(week[0])
          const weekEnd = endOfDay(week[6])
          const weekMultis = multidayEvents.filter(
            (event) => startOfDay(event.startTime) <= weekEnd && endOfDay(event.endTime) >= weekStart,
          )
          const barHeight = 22
          const barGap = 6
          const barTopOffset = 36
          const barsStackHeight = weekMultis.length > 0 ? weekMultis.length * (barHeight + barGap) + barTopOffset : 0

          return (
            <div key={weekIndex} className="relative border-b last:border-b-0">
              <div className="grid grid-cols-7">
                {week.map((day, dayIdx) => {
                  const dayEvents = eventsForDay(day)
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth()
                  const isToday = isSameDay(day, new Date())
                  const overflow = dayEvents.length > 3

                  return (
                    <div
                      key={dayIdx}
                      className={cn(
                        "min-h-24 border-r p-1 sm:p-2 last:border-r-0 transition-colors hover:bg-accent/50",
                        !isCurrentMonth && "bg-muted/30",
                      )}
                      onClick={(event) => {
                        const target = event.target as HTMLElement
                        if (target.closest("[data-event-card]") || target.closest("[data-day-control]")) {
                          return
                        }
                        onDayClick(day)
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDrop(day)}
                    >
                      <div
                        className={cn(
                          "mb-1 flex h-5 w-5 items-center justify-center rounded-full text-xs sm:h-6 sm:w-6 sm:text-sm",
                          isToday && "bg-primary text-primary-foreground font-semibold",
                        )}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1" style={barsStackHeight ? { marginTop: barsStackHeight } : undefined}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <EventCard
                            key={event.id}
                            event={event}
                            onEventClick={onEventClick}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            getColorClasses={getColorClasses}
                            variant="compact"
                            popoverAlign={dayIdx === 6 ? "right" : "left"}
                          />
                        ))}
                        {overflow && (
                          <button
                            type="button"
                            className="text-[10px] text-muted-foreground underline sm:text-xs"
                            data-day-control
                            onClick={(event) => {
                              event.stopPropagation()
                              setDayModalEvents(dayEvents)
                            }}
                          >
                            +{dayEvents.length - 3} mais
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {weekMultis.length > 0 && (
                <div className="pointer-events-none absolute left-0 right-0 px-1 sm:px-2" style={{ top: barTopOffset }}>
                  {weekMultis.map((event, idx) => {
                    const clippedStart =
                      startOfDay(event.startTime) < weekStart ? weekStart : startOfDay(event.startTime)
                    const clippedEnd = endOfDay(event.endTime) > weekEnd ? weekEnd : endOfDay(event.endTime)

                    const startIdx = Math.max(0, Math.min(6, dayDiff(weekStart, clippedStart)))
                    const endIdx = Math.max(startIdx, Math.min(6, dayDiff(weekStart, clippedEnd)))

                    const left = (startIdx / 7) * 100
                    const width = ((endIdx - startIdx + 1) / 7) * 100
                    const color = getColorClasses(event.color)
                    const leftStyle = `calc(${left}% + 2px)`
                    const widthStyle = `calc(${width}% - 4px)`

                    return (
                      <TooltipProvider delayDuration={0} key={`${event.id}-w${weekIndex}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="pointer-events-auto absolute overflow-hidden rounded-md text-[11px] font-medium text-white focus:outline-none"
                              style={{
                                top: idx * (barHeight + barGap),
                                left: leftStyle,
                                width: widthStyle,
                                height: barHeight,
                              }}
                              onClick={() => onEventClick(event)}
                              title={event.title}
                            >
                              <div
                                className={cn(
                                  "flex h-full items-center gap-2 whitespace-nowrap px-2 text-white",
                                  color.bg,
                                  "hover:opacity-90"
                                )}
                              >
                                <span className="truncate">{event.title}</span>
                                <span className="opacity-85 text-[10px]">{formatRange(event.startTime, event.endTime)}</span>
                              </div>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2">
                              <div className="font-medium leading-tight">{event.title}</div>
                              {event.description && (
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              )}
                              <div className="text-xs text-muted-foreground">
                                {formatRange(event.startTime, event.endTime)}
                              </div>
                              {(event.tags?.length || event.category) && (
                                <div className="flex flex-wrap gap-1">
                                  {event.category && (
                                    <Badge variant="secondary" className="text-[10px]">
                                      {event.category}
                                    </Badge>
                                  )}
                                  {event.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[10px]">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {dayModalEvents && (
        <Dialog open onOpenChange={(open) => !open && setDayModalEvents(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Eventos do dia</DialogTitle>
              <DialogDescription>Lista completa de eventos selecionados.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {dayModalEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onEventClick={(e) => {
                    setDayModalEvents(null)
                    onEventClick(e)
                  }}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  getColorClasses={getColorClasses}
                  variant="default"
                />
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDayModalEvents(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

// Week View Component
function WeekView({
  currentDate,
  events,
  setDayModalEvents,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  setDayModalEvents: (events: Event[] | null) => void
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const hours = Array.from({ length: 24 }, (_, i) => i)

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const dayDiff = (a: Date, b: Date) =>
    Math.floor((startOfDay(b).getTime() - startOfDay(a).getTime()) / (24 * 60 * 60 * 1000))

  const weekStart = startOfDay(weekDays[0])
  const weekEnd = endOfDay(weekDays[6])

  const singleDayEvents = events.filter(
    (event) => !isAllDayEvent(event) && isSameDay(event.startTime, event.endTime),
  )
  const multidayEvents = events.filter(
    (event) =>
      (isAllDayEvent(event) || !isSameDay(event.startTime, event.endTime)) &&
      startOfDay(event.startTime) <= weekEnd &&
      endOfDay(event.endTime) >= weekStart,
  )

  const getEventsForDay = (date: Date) =>
    singleDayEvents.filter((event) => {
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      return start <= dayEnd && end >= dayStart
    })

  const getEventsForDayAndHour = (date: Date, hour: number) =>
    singleDayEvents.filter((event) => {
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)
      const isWithinDay = start <= dayEnd && end >= dayStart
      if (!isWithinDay) return false
      // Same-day or boundary day: show at start hour (default 0 if invalid)
      const eventHour = start.getHours()
      return hour === (Number.isNaN(eventHour) ? 0 : eventHour)
    })

  const allDayHeight = Math.max(32, multidayEvents.length * 32 + 12)

  return (
    <Card className="overflow-auto relative shadow-none">
      {/* Linha all-day para eventos multiday */}
      <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">Dia inteiro</div>
        <div
          className="col-span-7 relative px-1 sm:px-2"
          style={{ minHeight: allDayHeight }}
        >
          {multidayEvents.map((event, idx) => {
            const color = getColorClasses(event.color)
            const start = new Date(event.startTime)
            const end = new Date(event.endTime)
            const clippedStart = start < weekStart ? weekStart : start
            const clippedEnd = end > weekEnd ? weekEnd : end
            const startIdx = Math.max(0, Math.min(6, dayDiff(weekStart, clippedStart)))
            const endIdx = Math.max(startIdx, Math.min(6, dayDiff(weekStart, clippedEnd)))
            const left = (startIdx / 7) * 100
            const width = ((endIdx - startIdx + 1) / 7) * 100

            return (
              <TooltipProvider delayDuration={0} key={`${event.id}-${idx}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onEventClick(event)}
                      className="absolute"
                      style={{ left: `${left}%`, width: `${width}%`, top: 6 + idx * 32 }}
                      title={event.title}
                    >
                      <div
                        className={cn(
                          "h-6 rounded-md text-[11px] font-medium text-white flex items-center px-2 shadow-sm",
                          color.bg,
                          "overflow-hidden whitespace-nowrap hover:opacity-90",
                        )}
                      >
                        <span className="truncate">{event.title}</span>
                        <span className="ml-2 opacity-85">{formatRange(start, end)}</span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-2">
                      <div className="font-medium leading-tight">{event.title}</div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground">{formatRange(start, end)}</div>
                      {(event.tags?.length || event.category) && (
                        <div className="flex flex-wrap gap-1">
                          {event.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {event.category}
                            </Badge>
                          )}
                          {event.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </div>
    <div className="grid grid-cols-8 border-b">
        <div className="border-r p-2 text-center text-xs font-medium sm:text-sm">Time</div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm"
          >
            <div className="hidden sm:block">{day.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
            <div className="sm:hidden">{day.toLocaleDateString("pt-BR", { weekday: "narrow" })}</div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">
              {day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </div>
            {getEventsForDay(day).length > 3 && (
              <button
                type="button"
                className="mt-1 text-[10px] text-muted-foreground underline"
                onClick={() => setDayModalEvents(getEventsForDay(day))}
              >
                +{getEventsForDay(day).length - 3} mais
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={`row-${hour}`}>
            <div className="border-b border-r p-1 text-[10px] text-muted-foreground sm:p-2 sm:text-xs">
              {hour.toString().padStart(2, "0")}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour)
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 border-b border-r p-0.5 transition-colors hover:bg-accent/50 last:border-r-0 sm:min-h-16 sm:p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  )
}

// Day View Component
function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

  const allDayEvents = events.filter((event) => {
    if (!isAllDayEvent(event)) return false
    const start = new Date(event.startTime)
    const end = new Date(event.endTime)
    const dayStart = startOfDay(currentDate)
    const dayEnd = endOfDay(currentDate)
    return start <= dayEnd && end >= dayStart
  })

  const getEventsForHour = (hour: number) =>
    events.filter((event) => {
      if (isAllDayEvent(event)) return false
      const start = new Date(event.startTime)
      const end = new Date(event.endTime)
      const dayStart = startOfDay(currentDate)
      const dayEnd = endOfDay(currentDate)
      const isWithinDay = start <= dayEnd && end >= dayStart
      if (!isWithinDay) return false
      const spansMultiple = end.getTime() - start.getTime() > 24 * 60 * 60 * 1000
      if (spansMultiple) {
        // Mostrar a faixa em todos os dias do intervalo na linha das 00h
        return hour === 0
      }
      // if spans previous/next day, pin at hour 0
      const sameDay =
        start.getFullYear() === currentDate.getFullYear() &&
        start.getMonth() === currentDate.getMonth() &&
        start.getDate() === currentDate.getDate()
      if (!sameDay) return hour === 0
      const eventHour = start.getHours()
      return hour === (Number.isNaN(eventHour) ? 0 : eventHour)
    })

  return (
    <Card className="overflow-auto shadow-none">
      <div className="space-y-0">
        {allDayEvents.length > 0 && (
          <div className="flex border-b bg-muted/30">
            <div className="w-14 flex-shrink-0 border-r p-2 text-[10px] text-muted-foreground sm:w-20 sm:p-3 sm:text-xs">
              Dia inteiro
            </div>
            <div className="min-h-12 flex-1 p-1 sm:min-h-14 sm:p-2">
              <div className="space-y-2">
                {allDayEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="default"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div
              key={hour}
              className="flex border-b last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-14 flex-shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2">
                <div className="space-y-2">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="detailed"
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// List View Component
function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  return (
    <Card className="p-3 sm:p-4 shadow-none">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={cn("mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3", colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors sm:text-base truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.category && (
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isAllDayEvent(event)
                            ? "Dia inteiro"
                            : `${event.startTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })} - ${event.endTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`}
                        </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] h-4 sm:text-xs sm:h-5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground sm:text-base">No events found</div>
        )}
      </div>
    </Card>
  )
}
