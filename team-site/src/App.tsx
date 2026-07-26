import { useState, useEffect } from 'react';

import {
  Activity,
  Bell,
  BookOpen,
  CalendarCheck,
  GitBranch,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';


import { CourseCard } from './components/CourseCard';
import { DeadlineBoard } from './components/DeadlineBoard';
import { LearningVelocity } from './components/LearningVelocity';
import { StatCard } from './components/StatCard';
import ContactForm from './components/ContactForm';


import { courses } from './data/courses';
import { deadlineCards } from './data/deadlines';
import { sprintStats } from './data/stats';


import { getAverageProgress } from './utils/metrics';



export function App() {

  const [authState, setAuthState] = useState<{
    authenticated: boolean;
    user?: {
      name: string;
      email: string;
      picture: string;
    };
  }>({
    authenticated: false,
  });



  useEffect(() => {

    fetch('/auth/me')
      .then((res) => res.json())

      .then((data) => {

        if (data.authenticated) {

          setAuthState({
            authenticated: true,
            user: data.user,
          });

        }

      })

      .catch((err) =>
        console.error(
          'Error fetching auth state:',
          err
        )
      );


  }, []);



  const averageProgress =
    getAverageProgress(courses);



  return (

    <main className="shell">


      <aside
        className="sidebar"
        aria-label="Primary"
      >

        <div className="brand">

          <div
            className="brandMark"
            aria-hidden="true"
          >
            <GraduationCap size={24} />
          </div>


          <div>

            <strong>
              Deploy Sprint
            </strong>

            <span>
              Virtual LMS
            </span>

          </div>

        </div>



        <nav className="navLinks">


          <a
            className="active"
            href="#overview"
          >
            <Activity size={18} />
            Overview
          </a>


          <a href="#courses">

            <BookOpen size={18} />

            Courses

          </a>



          <a href="#deadlines">

            <CalendarCheck size={18} />

            Deadlines

          </a>



          <a href="#teams">

            <Users size={18} />

            Teams

          </a>



          <a href="#contact">

            Contact

          </a>


        </nav>



        <div className="sidebarPanel">

          <ShieldCheck size={18} />

          <p>
            Repository changes are reviewed before every release.
          </p>

        </div>



      </aside>





      <section className="workspace">


        <header className="topbar">


          <div>

            <p className="eyebrow">
              Qualifier Dashboard
            </p>


            <h1>
              Learning operations at a glance
            </h1>

          </div>





          <label className="searchBox">

            <Search size={18} />

            <input
              aria-label="Search courses"
              placeholder="Search courses"
            />

          </label>






          <div
            className="auth-widget"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginLeft: '12px'
            }}
          >


            {
              authState.authenticated &&
              authState.user ?


              (

                <>

                  <img

                    src={authState.user.picture}

                    alt={authState.user.name}

                    style={{

                      width: '32px',

                      height: '32px',

                      borderRadius: '50%'

                    }}

                  />



                  <span

                    style={{

                      fontSize: '14px',

                      fontWeight: 500

                    }}

                  >

                    {authState.user.name}

                  </span>




                  <a

                    href="/auth/logout"

                    className="logout-btn"

                    style={{

                      fontSize: '12px',

                      color: '#ff4d4f',

                      textDecoration: 'none',

                      padding: '6px 12px',

                      border: '1px solid #ff4d4f',

                      borderRadius: '4px'

                    }}

                  >

                    Logout

                  </a>


                </>


              )


              :

              (

                <a

                  href="/auth/google"

                  className="login-btn"

                  style={{

                    fontSize: '14px',

                    color: '#ffffff',

                    backgroundColor: '#4285f4',

                    textDecoration: 'none',

                    padding: '8px 16px',

                    borderRadius: '4px',

                    fontWeight: 500,

                    display: 'inline-flex',

                    alignItems: 'center',

                    gap: '8px'

                  }}

                >

                  Login with Google

                </a>


              )

            }


          </div>





          <button

            className="iconButton"

            aria-label="Notifications"

            style={{
              marginLeft: '12px'
            }}

          >

            <Bell size={20} />

          </button>



        </header>







        <section
          className="heroBand"
          id="overview"
        >


          <div>


            <p className="eyebrow">

              Sprint health

            </p>



            <h2>

              {averageProgress}% average course progress

            </h2>




            <p>

              Track cohorts, deadlines, and review readiness
              from one dashboard before publishing a release.

            </p>


          </div>





          <div className="heroSignal">

            <GitBranch size={32} />

            <span>

              4 active learning tracks

            </span>


          </div>



        </section>







        <section
          className="statGrid"
          aria-label="Sprint statistics"
        >

          {
            sprintStats.map((stat) => (

              <StatCard

                key={stat.label}

                stat={stat}

              />

            ))
          }


        </section>





        <LearningVelocity courses={courses} />







        <section className="contentGrid">


          <div
            className="panel"
            id="courses"
          >


            <div className="panelHeader">


              <div>

                <p className="eyebrow">

                  Courses

                </p>



                <h2>

                  Current modules

                </h2>


              </div>




              <span>

                {courses.length} modules

              </span>



            </div>





            <div className="courseList">


              {
                courses.map((course) => (

                  <CourseCard

                    key={course.id}

                    course={course}

                  />

                ))
              }


            </div>



          </div>






          <DeadlineBoard

            deadlines={deadlineCards}

          />



        </section>









        <section

          id="contact"

          className="panel"

        >


          <div className="panelHeader">


            <div>


              <p className="eyebrow">

                Support

              </p>


              <h2>

                Contact Us

              </h2>


            </div>


          </div>





          <ContactForm />



        </section>





      </section>



    </main>


  );

}